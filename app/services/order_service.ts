import AddressService from '#services/address_service'
import Item from '#models/item'
import Order from '#models/order'
import type User from '#models/user'
import { ItemTypeLabel, type ItemType } from '#enums/item_enum'
import { OrderStatus, OrderType } from '#enums/order_enum'
import type { OrderData } from '#validators/order_validator'
import { errors as vineErrors } from '@vinejs/vine'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

export const DAILY_PICKUP_LIMIT = 10

const ORDER_NUMBER_ATTEMPTS = 3

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PICKUP_SCHEDULED]: [OrderStatus.IN_PICKUP, OrderStatus.CANCELLED],
  [OrderStatus.IN_PICKUP]: [OrderStatus.IN_INSPECTION],
  [OrderStatus.IN_INSPECTION]: [OrderStatus.AWAITING_PAYMENT],
  [OrderStatus.AWAITING_PAYMENT]: [OrderStatus.IN_CLEANING],
  [OrderStatus.IN_CLEANING]: [OrderStatus.IN_DELIVERY, OrderStatus.CLEANING_DONE],
  [OrderStatus.CLEANING_DONE]: [OrderStatus.COMPLETED],
  [OrderStatus.IN_DELIVERY]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
}

const DELIVERABLE_TYPES: readonly OrderType[] = [OrderType.ONLINE, OrderType.WALK_IN_DELIVERY]

function isDuplicateOrderNumber(error: unknown): boolean {
  return (error as { code?: string })?.code === '23505'
}

@inject()
export default class OrderService {
  constructor(protected addressService: AddressService) {}

  async getCustomerOrders(user: User): Promise<Order[]> {
    return Order.query().where('user_id', user.id).orderBy('created_at', 'desc')
  }

  async itemSummaries(orderIds: number[]): Promise<Map<number, string>> {
    if (orderIds.length === 0) {
      return new Map()
    }

    const rows = await db
      .from('items')
      .whereIn('order_id', orderIds)
      .select('order_id', 'type')
      .count('* as total')
      .groupBy('order_id', 'type')

    const summaries = new Map<number, string[]>()

    for (const row of rows) {
      const parts = summaries.get(row.order_id) ?? []

      parts.push(`${row.total} ${ItemTypeLabel[row.type as ItemType]}`)
      summaries.set(row.order_id, parts)
    }

    return new Map([...summaries].map(([id, parts]) => [id, parts.join(', ')]))
  }

  async getCustomerOrderByNumber(user: User, orderNumber: string): Promise<Order> {
    return Order.query()
      .where('user_id', user.id)
      .where('order_number', orderNumber)
      .preload('address')
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('orderItems').orderBy('id', 'asc')
      })
      .firstOrFail()
  }

  async createOnlineOrder(user: User, data: OrderData): Promise<Order> {
    const address = await this.addressService.getActiveAddress(user)

    if (!address) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'form',
          message: 'Tambahkan alamat penjemputan terlebih dahulu sebelum membuat pesanan.',
        },
      ])
    }

    await this.#assertPickupCapacity(data.pickupDate)

    return this.#createWithUniqueOrderNumber((orderNumber) =>
      db.transaction(async (trx) => {
        const order = await Order.create(
          {
            userId: user.id,
            addressId: address.id,
            customerName: address.name,
            customerPhone: address.phone,
            orderNumber,
            pickupDate: data.pickupDate,
            type: OrderType.ONLINE,
            status: OrderStatus.PICKUP_SCHEDULED,
            totalPrice: null,
          },
          { client: trx }
        )

        await Item.createMany(
          data.items.map((item) => ({
            orderId: order.id,
            type: item.type,
            brand: item.brand,
            model: item.model,
            size: item.size,
            material: item.material,
            note: item.note ?? null,
          })),
          { client: trx }
        )

        return order
      })
    )
  }

  nextStatuses(order: Order): readonly OrderStatus[] {
    if (order.status !== OrderStatus.IN_CLEANING) {
      return ORDER_TRANSITIONS[order.status]
    }

    return this.isDeliverable(order) ? [OrderStatus.IN_DELIVERY] : [OrderStatus.CLEANING_DONE]
  }

  isDeliverable(order: Order): boolean {
    return DELIVERABLE_TYPES.includes(order.type) && order.addressId !== null
  }

  canTransitionTo(order: Order, status: OrderStatus): boolean {
    return this.nextStatuses(order).includes(status)
  }

  async transitionTo(
    order: Order,
    status: OrderStatus,
    trx?: TransactionClientContract
  ): Promise<Order> {
    if (order.status === status) {
      return order
    }

    if (!this.canTransitionTo(order, status)) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'status',
          message: 'Status pesanan tidak dapat diubah ke tahap tersebut.',
        },
      ])
    }

    order.merge({ status })

    if (trx) {
      order.useTransaction(trx)
    }

    await order.save()

    return order
  }

  /**
   * An order can be paid once it has been inspected and priced, and only then:
   * before that there is no bill, and afterwards the money is already in.
   */
  canPay(order: Order): boolean {
    return order.status === OrderStatus.AWAITING_PAYMENT && Number(order.totalPrice ?? 0) > 0
  }

  canCancel(order: Order): boolean {
    const pickupDate = order.pickupDate?.startOf('day')

    return (
      order.status === OrderStatus.PICKUP_SCHEDULED &&
      !!pickupDate &&
      pickupDate > DateTime.now().startOf('day')
    )
  }

  async cancelOrder(user: User, orderNumber: string): Promise<Order> {
    const order = await this.getCustomerOrderByNumber(user, orderNumber)

    if (!this.canCancel(order)) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'form',
          message: 'Pesanan hanya dapat dibatalkan sebelum tanggal penjemputan.',
        },
      ])
    }

    return this.transitionTo(order, OrderStatus.CANCELLED)
  }

  async #assertPickupCapacity(pickupDate: DateTime): Promise<void> {
    const scheduled = await Order.query()
      .where('pickup_date', pickupDate.toFormat('yyyy-MM-dd'))
      .where('status', OrderStatus.PICKUP_SCHEDULED)
      .count('* as total')

    if (Number(scheduled[0].$extras.total) >= DAILY_PICKUP_LIMIT) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'pickupDate',
          message: 'Kuota penjemputan untuk tanggal ini sudah penuh. Silakan pilih tanggal lain.',
        },
      ])
    }
  }

  async generateOrderNumber(): Promise<string> {
    const prefix = `ORD${DateTime.now().toFormat('yyLL')}`

    const result = await db
      .from('orders')
      .where('order_number', 'like', `${prefix}-%`)
      .select(db.raw(`max(split_part(order_number, '-', 2)::int) as last_sequence`))
      .first()

    const lastSequence = Number(result?.last_sequence ?? 0)

    return `${prefix}-${String(lastSequence + 1).padStart(4, '0')}`
  }

  async #createWithUniqueOrderNumber(
    create: (orderNumber: string) => Promise<Order>
  ): Promise<Order> {
    let lastError: unknown

    for (let attempt = 0; attempt < ORDER_NUMBER_ATTEMPTS; attempt++) {
      try {
        return await create(await this.generateOrderNumber())
      } catch (error) {
        if (!isDuplicateOrderNumber(error)) {
          throw error
        }

        lastError = error
      }
    }

    throw lastError
  }
}

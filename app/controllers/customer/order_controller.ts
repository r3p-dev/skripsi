import AddressService from '#services/address_service'
import AddressTransformer from '#transformers/address_transformer'
import Order from '#models/order'
import OrderTransformer from '#transformers/order_transformer'
import { ItemTypeLabel, type ItemType } from '#enums/item_enum'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class OrderController {
  constructor(protected addressService: AddressService) {}

  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    const orders = await Order.query().where('user_id', user.id).orderBy('created_at', 'desc')
    const summaries = await this.#itemSummaries(orders.map((order) => order.id))

    return inertia.render('customer/order/index', {
      orders: OrderTransformer.transform(orders),
      summaries: Object.fromEntries(summaries),
    })
  }

  async create({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    const address = await this.addressService.getActiveAddress(user)

    return inertia.render('customer/order/create', {
      address: AddressTransformer.transform(address),
    })
  }

  async #itemSummaries(orderIds: number[]): Promise<Map<number, string>> {
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
}

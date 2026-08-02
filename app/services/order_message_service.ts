import { ActionName } from '#enums/order_action_enum'
import { OrderStatus } from '#enums/order_status_enum'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import type User from '#models/user'
import FonnteService from '#services/fonnte_service'
import { formatRupiah } from '#utils/currency'
import { inject } from '@adonisjs/core'
import { errors as vineErrors } from '@vinejs/vine'

/**
 * Sends the two WhatsApp messages staff can address to a customer about an
 * order, and records that they went out.
 *
 * Both are triggered by hand from the counter rather than fired on a timer.
 * Staff can see the difference between a customer who forgot and one who is
 * still thinking about it, and between shoes that are ready and shoes that are
 * ready but the owner already said they are travelling. An automatic message
 * cannot, and gets it wrong in public.
 *
 * Every send is written to the order's audit trail, so "we already chased
 * them" is something the record answers rather than something two staff
 * members disagree about — and so the same customer is not messaged twice.
 */
@inject()
export default class OrderMessageService {
  constructor(private fonnteService: FonnteService) {}

  /**
   * Chases payment on an order that has been quoted but not settled.
   */
  async sendPaymentReminder(staff: User, orderNumber: string): Promise<Order> {
    const order = await Order.findByOrFail('orderNumber', orderNumber)

    if (order.status !== OrderStatus.AWAITING_PAYMENT) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'status',
          message: 'Pesanan ini tidak sedang menunggu pembayaran.',
        },
      ])
    }

    await this.fonnteService.sendPaymentReminder(
      order.customerPhone,
      order.orderNumber,
      formatRupiah(order.totalPrice ?? 0)
    )

    return this.record(order, staff, ActionName.PAYMENT_REMINDER_SENT)
  }

  /**
   * Tells a walk-in customer their shoes are washed and waiting on the shelf.
   *
   * Restricted to orders that are actually sitting at the counter. An order
   * out for delivery arrives on its own, and telling someone to come and
   * collect shoes that are in the back of a van is worse than saying nothing.
   */
  async sendReadyNotice(staff: User, orderNumber: string): Promise<Order> {
    const order = await Order.findByOrFail('orderNumber', orderNumber)

    if (order.status !== OrderStatus.CLEANING_DONE) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'status',
          message: 'Pesanan ini belum siap diambil di toko.',
        },
      ])
    }

    await this.fonnteService.sendReadyForCollection(order.customerPhone, order.orderNumber)

    return this.record(order, staff, ActionName.READY_NOTICE_SENT)
  }

  /**
   * Whether a given message has already gone out for this order, so the
   * interface can say "sent" instead of offering the button again.
   */
  async hasSent(order: Order, name: ActionName): Promise<boolean> {
    const result = await OrderAction.query()
      .where('order_id', order.id)
      .where('name', name)
      .count('* as total')

    return Number(result[0].$extras.total) > 0
  }

  private async record(order: Order, staff: User, name: ActionName): Promise<Order> {
    await OrderAction.create({
      orderId: order.id,
      staffId: staff.id,
      name,
      photoPath: null,
      note: null,
    })

    return order
  }
}

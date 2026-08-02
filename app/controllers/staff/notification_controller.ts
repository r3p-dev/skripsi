import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import OrderMessageService from '#services/order_message_service'
import { orderNotificationValidator, OrderNotice } from '#validators/notification_validator'

@inject()
export default class NotificationController {
  constructor(protected orderMessageService: OrderMessageService) {}

  /**
   * Sends the customer one of the two WhatsApp messages an order can warrant:
   * a nudge to pay, or word that their shoes are ready to collect.
   *
   * Triggered by hand rather than on a timer. Staff are the ones who can tell
   * a customer who forgot from one who is still deciding, and who already said
   * they would be away this week — an automatic message cannot, and gets it
   * wrong where the customer can see.
   */
  async store({ auth, params, request, response, session }: HttpContext) {
    const staff = auth.getUserOrFail()
    const { notice } = await request.validateUsing(orderNotificationValidator)
    const orderNumber = String(params.number)

    const order =
      notice === OrderNotice.PAYMENT
        ? await this.orderMessageService.sendPaymentReminder(staff, orderNumber)
        : await this.orderMessageService.sendReadyNotice(staff, orderNumber)

    session.flash('success', `Pesan WhatsApp untuk pesanan ${order.orderNumber} terkirim.`)
    return response.redirect().back()
  }
}

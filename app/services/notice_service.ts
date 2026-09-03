import Order from '#models/order'
import OrderAction from '#models/order_action'
import WhatsappService from '#notifications/whatsapp_service'
import { ActionName } from '#enums/order_action_enum'
import { OrderStatus } from '#enums/order_enum'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { formatRupiah } from '#utils/currency'

export type NoticeResult = {
  sent: number
  skipped: number
  failed: number
}

export type DailyNoticeReport = {
  readyForCollection: NoticeResult
  paymentReminder: NoticeResult
}

/**
 * One notice: which orders are due one, what to say, and the mark left behind
 * so the same customer is never told twice.
 */
type Notice = {
  action: ActionName
  status: OrderStatus
  description: string
  eligible(): Promise<Order[]>
  send(order: Order): Promise<void>
}

@inject()
export default class NoticeService {
  constructor(protected whatsappService: WhatsappService) {}

  async sendDailyNotices(): Promise<DailyNoticeReport> {
    return {
      readyForCollection: await this.sendReadyForCollectionNotices(),
      paymentReminder: await this.sendPaymentReminders(),
    }
  }

  async sendReadyForCollectionNotices(): Promise<NoticeResult> {
    return this.#deliver({
      action: ActionName.READY_NOTICE_SENT,
      status: OrderStatus.CLEANING_DONE,
      description: 'ready for collection',
      eligible: () => this.#unnotified(OrderStatus.CLEANING_DONE, ActionName.READY_NOTICE_SENT),
      send: (order) =>
        this.whatsappService.sendReadyForCollection(order.customerPhone, order.orderNumber),
    })
  }

  async sendPaymentReminders(): Promise<NoticeResult> {
    return this.#deliver({
      action: ActionName.PAYMENT_REMINDER_SENT,
      status: OrderStatus.AWAITING_PAYMENT,
      description: 'payment reminder',
      eligible: async () => {
        const orders = await this.#unnotified(
          OrderStatus.AWAITING_PAYMENT,
          ActionName.PAYMENT_REMINDER_SENT
        )

        return orders.filter((order) => this.#isBilled(order))
      },
      send: (order) =>
        this.whatsappService.sendPaymentReminder(
          order.customerPhone,
          order.orderNumber,
          formatRupiah(order.totalPrice!)
        ),
    })
  }

  async #deliver(notice: Notice): Promise<NoticeResult> {
    const result: NoticeResult = { sent: 0, skipped: 0, failed: 0 }

    for (const candidate of await notice.eligible()) {
      const order = await Order.find(candidate.id)

      /**
       * The list was read at the start of the run, so an order may since have
       * been collected, cancelled or paid for. Nobody is messaged about a
       * stage they have already left behind.
       */
      if (!order || order.status !== notice.status) {
        result.skipped += 1

        continue
      }

      if (await this.#alreadySent(order, notice.action)) {
        result.skipped += 1

        continue
      }

      try {
        await notice.send(order)
      } catch (error) {
        result.failed += 1

        logger.error(
          { err: error, order: order.orderNumber, notice: notice.description },
          'Could not send a daily notice'
        )

        continue
      }

      await OrderAction.create({
        orderId: order.id,
        userId: null,
        name: notice.action,
        photoPath: null,
        note: null,
      })

      result.sent += 1

      logger.info(
        { order: order.orderNumber, target: order.customerPhone, notice: notice.description },
        'Daily notice sent'
      )
    }

    return result
  }

  async #unnotified(status: OrderStatus, action: ActionName): Promise<Order[]> {
    return Order.query()
      .where('status', status)
      .whereDoesntHave('actions', (actions) => actions.where('name', action))
      .orderBy('id', 'asc')
  }

  #isBilled(order: Order): boolean {
    return Number(order.totalPrice ?? 0) > 0
  }

  async #alreadySent(order: Order, action: ActionName): Promise<boolean> {
    const sent = await OrderAction.query().where('order_id', order.id).where('name', action).first()

    return !!sent
  }
}

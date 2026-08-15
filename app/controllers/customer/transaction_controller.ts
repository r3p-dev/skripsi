import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'
import TransactionService from '#services/transaction_service'
import TransactionTransformer from '#transformers/transaction_transformer'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class TransactionController {
  constructor(
    protected orderService: OrderService,
    protected transactionService: TransactionService
  ) {}

  async show({ auth, inertia, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await this.orderService.getCustomerOrderByNumber(user, params.number)
    const transaction = await this.transactionService.getLatestTransaction(order)

    if (!transaction) {
      session.flash('error', 'Belum ada pembayaran untuk pesanan ini.')

      return response.redirect().toRoute('customer.orders.show', { number: order.orderNumber })
    }

    return inertia.render('order/payment', {
      order: OrderTransformer.transform(order).useVariant('toDetail'),
      transaction: TransactionTransformer.transform(transaction),
    })
  }

  async store({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await this.orderService.getCustomerOrderByNumber(user, params.number)

    await this.transactionService.startPayment(order)

    session.flash('success', 'Silakan selesaikan pembayaran dengan memindai kode QR.')

    return response.redirect().toRoute('customer.transaction.show', { number: order.orderNumber })
  }
}

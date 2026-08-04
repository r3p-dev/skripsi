import OrderService from '#services/order_service'
import TransactionService from '#services/transaction_service'
import OrderTransformer from '#transformers/order_transformer'
import TransactionTransformer from '#transformers/transaction_transformer'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class TransactionController {
  constructor(
    protected orderService: OrderService,
    protected transactionService: TransactionService
  ) {}

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const orderNumber = String(request.param('number'))

    const order = await this.orderService.getOrderByNumber(orderNumber, user)
    await this.transactionService.createQrisTransaction(order)

    return response.redirect().toRoute('customer.transaction.show', { number: order.orderNumber })
  }

  async show({ auth, request, inertia, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const orderNumber = String(request.param('number'))

    const order = await this.orderService.getOrderByNumber(orderNumber, user)
    const transaction = await this.transactionService.getLatestTransaction(order)

    if (!transaction) {
      session.flash('error', 'Belum ada transaksi untuk pesanan ini.')
      return response.redirect().toRoute('customer.order.show', { number: order.orderNumber })
    }

    return inertia.render('order/payment', {
      order: OrderTransformer.transform(order).useVariant('toDetail'),
      transaction: TransactionTransformer.transform(transaction),
      backRoute: 'customer.order.show',
      retryRoute: 'customer.transaction.store',
    })
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import OrderService from '#services/order_service'
import TransactionService from '#services/transaction_service'
import OrderTransformer from '#transformers/order_transformer'
import TransactionTransformer from '#transformers/transaction_transformer'

@inject()
export default class TransactionController {
  constructor(
    protected orderService: OrderService,
    protected transactionService: TransactionService
  ) {}

  async store({ request, response }: HttpContext) {
    const orderNumber = String(request.param('number'))

    const order = await this.orderService.getOrderByNumber(orderNumber)
    await this.transactionService.createQrisTransaction(order)

    return response.redirect().toRoute('staff.transaction.show', { number: order.orderNumber })
  }

  async show({ request, inertia, response, session }: HttpContext) {
    const orderNumber = String(request.param('number'))

    const order = await this.orderService.getOrderByNumber(orderNumber)
    const transaction = await this.transactionService.getLatestTransaction(order)

    if (!transaction) {
      session.flash('error', 'Belum ada transaksi untuk pesanan ini.')
      return response.redirect().toRoute('staff.trip.index')
    }

    return inertia.render('order/payment', {
      order: OrderTransformer.transform(order).useVariant('toDetail'),
      transaction: TransactionTransformer.transform(transaction),
      backRoute: 'staff.trip.index',
      retryRoute: 'staff.transaction.store',
    })
  }
}

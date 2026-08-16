import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'
import TransactionService from '#services/transaction_service'
import { OrderStatus } from '#enums/order_enum'
import { PaymentMethod, PaymentMethodLabel } from '#enums/transaction_enum'
import { reconciliationValidator } from '#validators/admin_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class ReconciliationController {
  constructor(
    protected orderService: OrderService,
    protected transactionService: TransactionService
  ) {}

  async index({ inertia, request }: HttpContext) {
    const filters = {
      search: request.input('search', '') || '',
      page: Number(request.input('page', 1)) || 1,
    }

    const orders = await this.orderService.listForAdmin({
      ...filters,
      status: OrderStatus.AWAITING_PAYMENT,
      type: '',
    })

    return inertia.render('admin/reconciliation/index', {
      orders: OrderTransformer.paginate(orders.all(), orders.getMeta()).useVariant('toListItem'),
      filters,
      paymentMethodOptions: Object.values(PaymentMethod).map((method) => ({
        value: method,
        label: PaymentMethodLabel[method],
      })),
    })
  }

  async update({ params, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(reconciliationValidator)
    const order = await this.orderService.findForAdmin(params.number)

    await this.transactionService.confirmManualPayment(order, payload.paymentMethod, payload.note)

    session.flash('success', `Pesanan ${order.orderNumber} ditandai lunas.`)
    return response.redirect().toRoute('admin.reconciliation.index')
  }
}

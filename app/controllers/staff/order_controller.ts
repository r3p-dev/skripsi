import CatalogueService from '#services/catalogue_service'
import OrderTransformer from '#transformers/order_transformer'
import TaskService from '#services/task_service'
import TransactionService from '#services/transaction_service'
import { offlineOrderValidator, orderItemsValidator } from '#validators/task_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import CatalogueTransformer from '#transformers/catalogue_transformer'
import { formatRupiah } from '#utils/currency'

@inject()
export default class OrderController {
  constructor(
    protected catalogueService: CatalogueService,
    protected taskService: TaskService,
    protected transactionService: TransactionService
  ) {}

  async create({ inertia }: HttpContext) {
    const catalogues = await this.catalogueService.getPublicCatalogues()

    return inertia.render('staff/order/create', {
      catalogues: CatalogueTransformer.transform(catalogues),
    })
  }

  async store({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const payload = await request.validateUsing(offlineOrderValidator)
    const order = await this.taskService.createOfflineOrder(user, payload)

    session.flash('success', 'Pesanan offline berhasil dibuat.')
    return response.redirect().toRoute('staff.order.receipt', { number: order.orderNumber })
  }

  async edit({ inertia, params }: HttpContext) {
    const [order, catalogues] = await Promise.all([
      this.taskService.findByNumber(params.number),
      this.catalogueService.getPublicCatalogues(),
    ])

    return inertia.render('staff/order/edit', {
      order: OrderTransformer.transform(order).useVariant('toDetail'),
      catalogues: CatalogueTransformer.transform(catalogues),
      canEdit: this.taskService.canEditItems(order),
      isCounterOrder: this.taskService.isCounterOrder(order),
    })
  }

  async update({ params, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(orderItemsValidator)
    const order = await this.taskService.findSummaryByNumber(params.number)

    await this.taskService.updateOrderItems(order, payload)

    session.flash('success', 'Data barang berhasil diperbarui.')
    return response.redirect().toRoute('staff.trip.index')
  }

  async receipt({ inertia, params }: HttpContext) {
    const order = await this.taskService.findByNumber(params.number)
    const transaction = await this.transactionService.getLatestTransaction(order)

    const change = this.taskService.changeFor(order, transaction)

    return inertia.render('staff/order/receipt', {
      order: OrderTransformer.transform(order).useVariant('toDetail'),
      changeLabel: formatRupiah(change),
    })
  }

  async customers({ request, response }: HttpContext) {
    const customers = await this.taskService.findCustomers(request.input('search', ''))

    return response.json({
      customers: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
      })),
    })
  }
}

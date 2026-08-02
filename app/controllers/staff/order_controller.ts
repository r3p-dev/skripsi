import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { PaymentMethod } from '#enums/transaction_enum'
import OrderService from '#services/order_service'
import TaskService from '#services/task_service'
import TransactionService from '#services/transaction_service'
import OrderTransformer from '#transformers/order_transformer'
import ServiceTransformer from '#transformers/service_transformer'
import { offlineOrderValidator, orderItemsValidator } from '#validators/order_validator'

@inject()
export default class OrderController {
  constructor(
    protected orderService: OrderService,
    protected taskService: TaskService,
    protected transactionService: TransactionService
  ) {}

  async create({ inertia }: HttpContext) {
    const services = await this.orderService.getAvailableServices()

    return inertia.render('staff/order/create', {
      services: ServiceTransformer.transform(services),
    })
  }

  async store({ auth, request, response, session }: HttpContext) {
    const staff = auth.getUserOrFail()
    const payload = await request.validateUsing(offlineOrderValidator)

    const order = await this.orderService.createOfflineOrder(staff, payload)

    if (payload.paymentMethod === PaymentMethod.QRIS) {
      return response.redirect().toRoute('staff.transaction.show', { number: order.orderNumber })
    }

    /**
     * Cash and card are settled the moment the order is written up, so staff
     * go straight to the receipt: it carries the change owed, and it is the
     * slip that gets stapled to the shoes.
     */
    session.flash('success', 'Pesanan berhasil dibuat.')
    return response.redirect().toRoute('staff.order.receipt', { number: order.orderNumber })
  }

  /**
   * The counter receipt, printed twice on one sheet.
   *
   * One copy goes home with the customer and one is attached to the shoes, so
   * the batch on the rack can be matched to the person who is coming back for
   * it without anyone having to look it up. Printing the page twice would work
   * too, and would also mean two trips to the printer during a queue.
   */
  async receipt({ params, inertia }: HttpContext) {
    const order = await this.orderService.getOrderByNumber(String(params.number))
    const transaction = await this.transactionService.getLatestTransaction(order)

    return inertia.render('staff/order/receipt', {
      order: OrderTransformer.transform(order).useVariant('toDetail'),
      /**
       * Worked out on the server so the receipt, the confirmation on screen
       * and any later look at the order all quote the same figure.
       */
      change: transaction ? this.transactionService.changeFor(order, transaction) : 0,
    })
  }

  /**
   * The correction form for the items staff just inspected, reached straight
   * after finishing an inspection. Only reachable while the order is awaiting
   * payment — afterwards the price is settled and the shoes are being washed.
   */
  async edit({ params, inertia }: HttpContext) {
    const order = await this.taskService.getEditableItemsOrder(String(params.number))
    const services = await this.orderService.getAvailableServices()

    return inertia.render('staff/order/edit', {
      /**
       * The order arrives with its lines already two levels deep, so the form
       * can fill itself from each line's item and the service picked for it.
       */
      order: OrderTransformer.transform(order).useVariant('toDetail'),
      services: ServiceTransformer.transform(services),
    })
  }

  async update({ auth, params, request, response, session }: HttpContext) {
    const staff = auth.getUserOrFail()
    const payload = await request.validateUsing(orderItemsValidator)

    const order = await this.taskService.replaceOrderItems(staff, String(params.number), payload)

    session.flash('success', `Barang pesanan ${order.orderNumber} diperbarui.`)
    return response.redirect().toRoute('staff.trip.index')
  }
}

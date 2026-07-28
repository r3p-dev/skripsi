import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { PaymentMethod } from '#enums/transaction_enum'
import OrderService from '#services/order_service'
import TaskService from '#services/task_service'
import OrderItemTransformer from '#transformers/order_item_transformer'
import OrderTransformer from '#transformers/order_transformer'
import ServiceTransformer from '#transformers/service_transformer'
import { offlineOrderValidator, orderItemsValidator } from '#validators/order_validator'

@inject()
export default class OrderController {
  constructor(
    protected orderService: OrderService,
    protected taskService: TaskService
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

    session.flash('success', 'Pesanan offline berhasil dibuat.')
    return response.redirect().toRoute('staff.trip.index')
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
      order: OrderTransformer.transform(order),
      /**
       * The lines are sent on their own, two levels deep: the form fills itself
       * from each line's item and the service picked for it, and a transformer
       * nested inside another one stops at a single level by default.
       */
      items: OrderItemTransformer.transform(order.items).depth(2),
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

import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { PaymentMethod } from '#enums/transaction_enum'
import OrderService from '#services/order_service'
import ServiceTransformer from '#transformers/service_transformer'
import { offlineOrderValidator } from '#validators/order_validator'

@inject()
export default class OrderController {
  constructor(protected service: OrderService) {}

  async create({ inertia }: HttpContext) {
    const services = await this.service.getAvailableServices()

    return inertia.render('staff/order/create', {
      services: ServiceTransformer.transform(services),
    })
  }

  async store({ auth, request, response, session }: HttpContext) {
    const staff = auth.getUserOrFail()
    const payload = await request.validateUsing(offlineOrderValidator)

    const order = await this.service.createOfflineOrder(staff, payload)

    if (payload.paymentMethod === PaymentMethod.QRIS) {
      return response.redirect().toRoute('staff.transaction.show', { number: order.orderNumber })
    }

    session.flash('success', 'Pesanan offline berhasil dibuat.')
    return response.redirect().toRoute('staff.trip.index')
  }
}

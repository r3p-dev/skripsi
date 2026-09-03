import AddressService from '#services/address_service'
import AddressTransformer from '#transformers/address_transformer'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'
import { orderValidator } from '#validators/order_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class OrderController {
  constructor(
    protected orderService: OrderService,
    protected addressService: AddressService
  ) {}

  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    const orders = await this.orderService.getCustomerOrders(user)
    const summaries = await this.orderService.itemSummaries(orders.map((order) => order.id))

    return inertia.render('customer/order/index', {
      orders: OrderTransformer.transform(orders),
      summaries: Object.fromEntries(summaries),
    })
  }

  async create({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    const address = await this.addressService.getActiveAddress(user)

    return inertia.render('customer/order/create', {
      address: AddressTransformer.transform(address),
    })
  }

  async store({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const payload = await request.validateUsing(orderValidator)

    const order = await this.orderService.createOnlineOrder(user, payload)

    session.flash('success', 'Pesanan berhasil dibuat. Kami akan menjemput sesuai jadwal.')
    return response.redirect().toRoute('customer.orders.show', { number: order.orderNumber })
  }

  async show({ auth, inertia, params }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await this.orderService.getCustomerOrderByNumber(user, params.number)

    return inertia.render('customer/order/show', {
      order: OrderTransformer.transform(order).useVariant('toDetail'),
      canCancel: this.orderService.canCancel(order),
      canPay: this.orderService.canPay(order),
    })
  }

  async receipt({ auth, inertia, params }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await this.orderService.getCustomerOrderByNumber(user, params.number)

    return inertia.render('customer/order/receipt', {
      order: OrderTransformer.transform(order).useVariant('toDetail'),
    })
  }

  async destroy({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await this.orderService.cancelOrder(user, params.number)

    session.flash('success', 'Pesanan berhasil dibatalkan.')
    return response.redirect().toRoute('customer.orders.show', { number: order.orderNumber })
  }
}

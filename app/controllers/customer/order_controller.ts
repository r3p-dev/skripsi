import AddressService from '#services/address_service'
import OrderService from '#services/order_service'
import AddressTransformer from '#transformers/address_transformer'
import OrderTransformer from '#transformers/order_transformer'
import ServiceTransformer from '#transformers/service_transformer'
import { orderValidator } from '#validators/order_validator'
import { Filters } from '#validators/shared'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class OrderController {
  constructor(
    protected orderService: OrderService,
    protected addressService: AddressService
  ) {}

  async index({ auth, request, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const filters: Filters = {
      page: Number(request.qs().page) || 1,
      search: String(request.qs().search || '').trim(),
    }

    const orders = await this.orderService.getAllOrders(filters, user)

    return inertia.render('customer/order/index', {
      orders: OrderTransformer.paginate(orders.all(), orders.getMeta()).useVariant('toListItem'),
      filters,
    })
  }

  async create({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const address = await this.addressService.getActiveAddress(user)
    const services = await this.orderService.getAvailableServices()

    return inertia.render('customer/order/create', {
      address: AddressTransformer.transform(address),
      services: ServiceTransformer.transform(services),
    })
  }

  async store({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(orderValidator)

    const order = await this.orderService.createOnlineOrder(user, payload)

    session.flash('success', 'Pesanan berhasil dibuat!')
    return response.redirect().toRoute('customer.order.show', { number: order.orderNumber })
  }

  async show({ auth, request, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const orderNumber = String(request.param('number'))

    const order = await this.orderService.getOrderByNumber(orderNumber, user)

    return inertia.render('customer/order/show', {
      order: OrderTransformer.transform(order).useVariant('toDetail'),
      canCancel: this.orderService.canCancel(order),
    })
  }

  async receipt({ auth, request, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const orderNumber = String(request.param('number'))

    const order = await this.orderService.getOrderByNumber(orderNumber, user)

    return inertia.render('customer/order/receipt', {
      order: OrderTransformer.transform(order).useVariant('toDetail'),
    })
  }

  async update({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const orderNumber = String(request.param('number'))

    const order = await this.orderService.cancelOrder(user, orderNumber)

    session.flash('success', 'Pesanan berhasil dibatalkan.')
    return response.redirect().toRoute('customer.order.show', { number: order.orderNumber })
  }
}

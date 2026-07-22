import OrderService from '#services/order_service'
import AddressTransformer from '#transformers/address_transformer'
import OrderTransformer from '#transformers/order_transformer'
import { orderValidator } from '#validators/order_validator'
import { Filters } from '#validators/shared'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { type PageObject } from '@adonisjs/inertia/types'

/**
 * Manage order endpoints for authenticated customers.
 */
@inject()
export default class OrderController {
  constructor(protected orderService: OrderService) {}

  /**
   * Display all orders owned by the authenticated customer.
   */
  async index({ auth, request, inertia }: HttpContext): Promise<string | PageObject<{}>> {
    const user = auth.getUserOrFail()
    const filters: Filters = {
      page: Number(request.qs().page) || 1,
      search: String(request.qs().search || '').trim(),
    }

    const orders = await this.orderService.getAllCustomerOrders(user, filters)

    return inertia.render('customer/order/index', {
      orders: OrderTransformer.paginate(orders.all(), orders.getMeta()),
      filters,
    })
  }

  /**
   * Display the new order form.
   */
  async create({ inertia, auth }: HttpContext): Promise<string | PageObject<{}>> {
    const user = auth.getUserOrFail()

    const address = await user.related('addresses').query().where('is_active', true).first()

    return inertia.render('customer/order/create', {
      address: AddressTransformer.transform(address),
    })
  }

  /**
   * Create a pickup-scheduled order for the authenticated customer.
   */
  async store({ auth, request, response }: HttpContext): Promise<void> {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(orderValidator)

    const order = await this.orderService.createOnlineOrder(user, payload)

    return response.redirect().toRoute('customer.order.show', { number: order.orderNumber })
  }

  /**
   * Display the order details for the authenticated customer.
   */
  async show({ auth, request, inertia }: HttpContext): Promise<string | PageObject<{}>> {
    const user = auth.getUserOrFail()
    const orderNumber = String(request.param('number'))

    const order = await this.orderService.getCustomerOrderByNumber(user, orderNumber)

    return inertia.render('customer/order/show', {
      order: OrderTransformer.transform(order),
    })
  }

  /**
   * Update an order owned by the authenticated customer.
   */
  async update({ auth, request, response }: HttpContext): Promise<void> {
    const user = auth.getUserOrFail()
    const orderNumber = String(request.param('number'))

    const order = await this.orderService.cancelOrder(user, orderNumber)

    return response.redirect().toRoute('customer.order.show', { number: order.orderNumber })
  }
}

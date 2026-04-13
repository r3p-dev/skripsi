import { OrderStatus, OrderType, PaymentStatus } from '#models/order'
import AddressTransformer from '#transformers/address_transformer'
import OrderTransformer from '#transformers/order_transformer'
import { orderValidator } from '#validators/order_validator'
import type { HttpContext } from '@adonisjs/core/http'

interface Filters {
  search: string
  status: 'active' | 'completed'
  page: number
}

export default class OrderController {
  async create({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const address = await user.related('addresses').query().where('is_active', true).first()

    return inertia.render('customer/order/create', {
      address: AddressTransformer.transform(address),
    })
  }

  async store({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(orderValidator)

    const order = await user.related('orders').create({
      addressId: payload.addressId,
      date: payload.date,
      type: OrderType.PICKUP_DELIVERY,
      status: OrderStatus.AWAITING_DEPOSIT,
      paymentStatus: PaymentStatus.UNPAID,
      subtotalPrice: 0,
      discountAmount: 0,
      totalPrice: 0,
    })

    return response.redirect().toRoute('order.show', { number: order.number })
  }

  async index({ inertia, auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const filters: Filters = {
      page: Number(request.input('page', 1)),
      search: String(request.input('search', '')).trim(),
      status: this.normalizeStatusTab(request.input('status', 'active')),
    }

    const query = user.related('orders').query().preload('address')

    const { search = '', status = 'active', page = 1 } = filters
    if (search) {
      const searchTerm = `${search}%`
      query.where((searchQuery) => {
        searchQuery.whereILike('number', searchTerm).orWhereHas('address', (addressQuery) => {
          addressQuery
            .whereILike('name', searchTerm)
            .orWhereILike('phone', searchTerm)
            .orWhereILike('street', searchTerm)
        })
      })
    }

    if (status === 'completed') {
      query.where('status', OrderStatus.COMPLETED).orWhere('status', OrderStatus.CANCELLED)
    } else if (status === 'active') {
      query.whereNot('status', OrderStatus.COMPLETED).andWhereNot('status', OrderStatus.CANCELLED)
    }

    const orders = await query.orderBy('created_at', 'desc').paginate(page, 10)

    return inertia.render('customer/order/index', {
      orders: OrderTransformer.paginate(orders.all(), orders.getMeta()),
      filters,
    })
  }

  async show({ inertia, auth, params }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await user
      .related('orders')
      .query()
      .preload('address')
      .preload('items')
      .preload('shoes')
      .preload('transactions')
      .where('number', params.number)
      .firstOrFail()

    return inertia.render('customer/order/show', {
      order: OrderTransformer.transform(order),
    })
  }

  private normalizeStatusTab(statusInput: unknown): Filters['status'] {
    const status = String(statusInput ?? 'completed').toLowerCase()
    if (status === 'active') {
      return status
    }
    return 'completed'
  }
}

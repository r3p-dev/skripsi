import Order, { OrderStatus } from '#models/order'
import OrderTransformer from '#transformers/order_transformer'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

interface Filters {
  search: string
  status: 'all' | 'pickup' | 'delivery' | 'inspection'
  page: number
}

export default class TaskController {
  async index({ inertia, request, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const filters: Filters = {
      page: Number(request.input('page', 1)),
      search: String(request.input('search', '')).trim(),
      status: this.normalizeStatusTab(request.input('status', 'all')),
    }

    const query = Order.query()
      .preload('address')
      .where((builder) => {
        builder.whereNull('claimed_by').orWhere('claimed_by', user.id)
      })

    this.applyStatusFilter(query, filters.status)

    if (filters.search) {
      const searchTerm = `%${filters.search}%`
      query.where((builder) => {
        builder.whereILike('number', searchTerm).orWhereHas('address', (addressBuilder) => {
          addressBuilder
            .whereILike('name', searchTerm)
            .orWhereILike('phone', searchTerm)
            .orWhereILike('street', searchTerm)
        })

        const statusCode = this.findStatusCodeByDisplaySearch(filters.search)
        if (statusCode !== null) {
          builder.orWhere('status', statusCode)
        }
      })
    }

    const orders = await query.orderBy('created_at', 'asc').paginate(filters.page, 10)
    const counts = await Order.query()
      .where((q) => {
        q.whereNull('claimed_by').orWhere('claimed_by', user.id)
      })
      .select(
        db.raw(`COUNT(*) FILTER (WHERE status NOT IN (?, ?))::int as all`, [
          OrderStatus.COMPLETED,
          OrderStatus.CANCELLED,
        ]),
        db.raw(`COUNT(*) FILTER (WHERE status = ?)::int as pickup`, [OrderStatus.IN_PICKUP]),
        db.raw(`COUNT(*) FILTER (WHERE status = ?)::int as inspection`, [
          OrderStatus.IN_INSPECTION,
        ]),
        db.raw(`COUNT(*) FILTER (WHERE status = ?)::int as delivery`, [OrderStatus.IN_DELIVERY])
      )
      .first()

    return inertia.render('staff/tasks', {
      orders: OrderTransformer.transform(orders),
      filters,
      counts: OrderTransformer.transform(counts),
    })
  }

  private normalizeStatusTab(statusInput: unknown): Filters['status'] {
    const status = String(statusInput ?? 'all').toLowerCase()
    if (status === 'pickup' || status === 'delivery' || status === 'inspection') {
      return status
    }
    return 'all'
  }

  private applyStatusFilter(query: ReturnType<typeof Order.query>, status: Filters['status']) {
    if (status === 'pickup') {
      query.where('status', OrderStatus.IN_PICKUP)
    } else if (status === 'inspection') {
      query.where('status', OrderStatus.IN_INSPECTION)
    } else if (status === 'delivery') {
      query.where('status', OrderStatus.IN_DELIVERY)
    } else {
      query.whereNotIn('status', [OrderStatus.COMPLETED, OrderStatus.CANCELLED])
    }
  }

  private findStatusCodeByDisplaySearch(search: string): number | null {
    const keyword = search.toLowerCase()
    const map: Record<string, number> = {
      pickup: OrderStatus.IN_PICKUP,
      delivery: OrderStatus.IN_DELIVERY,
      inspection: OrderStatus.IN_INSPECTION,
    }

    for (const [label, code] of Object.entries(map)) {
      if (label.includes(keyword) || keyword.includes(label)) {
        return code
      }
    }

    return null
  }
}

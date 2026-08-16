import OrderService, { type AdminOrderFilters } from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'
import type Order from '#models/order'
import { OrderStatusLabel, OrderTypeLabel } from '#enums/order_enum'
import { SPREADSHEET_CONTENT_TYPE, toWorkbook, type SheetColumn } from '#utils/spreadsheet'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

const exportColumns: SheetColumn<Order>[] = [
  { header: 'Nomor', value: (order) => order.orderNumber },
  { header: 'Pelanggan', value: (order) => order.customerName },
  { header: 'Telepon', value: (order) => order.customerPhone },
  { header: 'Status', value: (order) => OrderStatusLabel[order.status] },
  { header: 'Tipe', value: (order) => OrderTypeLabel[order.type] },
  { header: 'Total', value: (order) => Number(order.totalPrice ?? 0) },
  {
    header: 'Jadwal Jemput',
    value: (order) => order.pickupDate?.toISODate() ?? '',
  },
  { header: 'Dibuat', value: (order) => order.createdAt.toISO() ?? '' },
]

@inject()
export default class OrderController {
  constructor(protected orderService: OrderService) {}

  async index({ inertia, request }: HttpContext) {
    const filters = this.#filters(request)
    const orders = await this.orderService.listForAdmin(filters)

    return inertia.render('admin/order/index', {
      orders: OrderTransformer.paginate(orders.all(), orders.getMeta()).useVariant('toListItem'),
      filters,
      statusOptions: this.orderService.statusOptions(),
      typeOptions: this.orderService.typeOptions(),
    })
  }

  async show({ inertia, params }: HttpContext) {
    const order = await this.orderService.findForAdmin(params.number)

    return inertia.render('admin/order/show', {
      order: OrderTransformer.transform(order).useVariant('toDetail'),
    })
  }

  async export({ request, response }: HttpContext) {
    const orders = await this.orderService.listAllForAdmin(this.#filters(request))
    const workbook = await toWorkbook('Pesanan', exportColumns, orders)

    response.header('Content-Type', SPREADSHEET_CONTENT_TYPE)
    response.header(
      'Content-Disposition',
      `attachment; filename="pesanan-${DateTime.now().toISODate()}.xlsx"`
    )

    return response.send(workbook)
  }

  #filters(request: HttpContext['request']): AdminOrderFilters {
    return {
      search: request.input('search', '') || '',
      page: Number(request.input('page', 1)) || 1,
      status: request.input('status', '') || '',
      type: request.input('type', '') || '',
    }
  }
}

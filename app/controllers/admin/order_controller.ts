import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { OrderStatus, OrderStatusLabel } from '#enums/order_status_enum'
import { OrderType, OrderTypeLabel } from '#enums/order_type_enum'
import {
  PaymentMethodLabel,
  TransactionStatusLabel,
  type PaymentMethod,
  type TransactionStatus,
} from '#enums/transaction_enum'
import type Order from '#models/order'
import ExcelService, {
  DATETIME_FORMAT,
  DATE_FORMAT,
  RUPIAH_FORMAT,
  excelDate,
  excelNumber,
  sheet,
  type Column,
} from '#services/excel_service'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'
import type { OrderFilters } from '#validators/shared'

/**
 * The options the monitor's two dropdowns offer. Built from the enums rather
 * than typed out, so a new status appears in the filter the day it is added.
 */
const STATUS_OPTIONS = Object.values(OrderStatus).map((status) => ({
  value: status,
  label: OrderStatusLabel[status],
}))

const TYPE_OPTIONS = Object.values(OrderType).map((type) => ({
  value: type,
  label: OrderTypeLabel[type],
}))

/**
 * The most recent charge against an order, which is the one that says where
 * its payment actually stands. The export preloads transactions newest first.
 */
function latestTransaction(order: Order) {
  return order.transactions.at(0)
}

/**
 * What the spreadsheet says about an order.
 *
 * Wider than the table on screen: a file is read away from the app, so it
 * carries the address and the payment state that the page leaves to the detail
 * view. Money and dates are written as real numbers and dates rather than as
 * pre-formatted text, so a column can be summed or sorted in Excel.
 */
const ORDER_COLUMNS: Column<Order>[] = [
  { header: 'Nomor', width: 20, value: (order) => order.orderNumber },
  { header: 'Tipe', width: 12, value: (order) => OrderTypeLabel[order.type as OrderType] },
  { header: 'Status', width: 24, value: (order) => OrderStatusLabel[order.status as OrderStatus] },
  { header: 'Pelanggan', width: 24, value: (order) => order.customerName },
  { header: 'Telepon', width: 16, value: (order) => order.customerPhone },
  { header: 'Alamat', width: 40, value: (order) => order.address?.street ?? null },
  {
    header: 'Tanggal Jemput',
    width: 16,
    format: DATE_FORMAT,
    value: (order) => excelDate(order.pickupDate),
  },
  {
    header: 'Dibuat',
    width: 18,
    format: DATETIME_FORMAT,
    value: (order) => excelDate(order.createdAt),
  },
  {
    header: 'Status Pembayaran',
    width: 18,
    value: (order) => {
      const transaction = latestTransaction(order)

      return transaction ? TransactionStatusLabel[transaction.status as TransactionStatus] : null
    },
  },
  {
    header: 'Metode Pembayaran',
    width: 18,
    value: (order) => {
      const transaction = latestTransaction(order)

      return transaction ? PaymentMethodLabel[transaction.paymentMethod as PaymentMethod] : null
    },
  },
  {
    header: 'Total',
    width: 16,
    format: RUPIAH_FORMAT,
    value: (order) => excelNumber(order.totalPrice),
  },
]

@inject()
export default class OrderController {
  constructor(
    protected orderService: OrderService,
    protected excelService: ExcelService
  ) {}

  async index({ request, inertia }: HttpContext) {
    const filters = this.filtersFrom(request.qs())

    const orders = await this.orderService.getMonitoredOrders(filters)

    return inertia.render('admin/order/index', {
      orders: OrderTransformer.paginate(orders.all(), orders.getMeta()).useVariant('toListItem'),
      filters,
      statusOptions: STATUS_OPTIONS,
      typeOptions: TYPE_OPTIONS,
    })
  }

  /**
   * The monitor as a spreadsheet.
   *
   * Reads the filters exactly the way `index` does, so the file is the list
   * the admin was looking at rather than a second, differently scoped answer.
   * The page number is the one thing ignored: a file of the ten rows that
   * happened to be on screen is not what anyone means by an export.
   */
  async export({ request, response }: HttpContext) {
    const filters = this.filtersFrom(request.qs())

    const orders = await this.orderService.getMonitoredOrdersForExport(filters)

    return this.excelService.download(response, 'pesanan', [
      sheet({ name: 'Pesanan', columns: ORDER_COLUMNS, rows: orders }),
    ])
  }

  async show({ request, inertia }: HttpContext) {
    const orderNumber = String(request.param('number'))

    const order = await this.orderService.getOrderByNumber(orderNumber)

    return inertia.render('admin/order/show', {
      /**
       * One prop, nested as deeply as an order detail view needs. The lines
       * carry their item and service and the actions carry the staff member
       * who recorded them, and how far down that is lives in the transformer
       * rather than being restated by every controller that wants an order.
       */
      order: OrderTransformer.transform(order).useVariant('toDetail'),
    })
  }

  /**
   * A status or type the query string made up is dropped rather than passed to
   * the query, so a hand-edited URL cannot produce a confusing empty list with
   * an unknown filter shown as active.
   */
  private filtersFrom(query: Record<string, unknown>): OrderFilters {
    const status = String(query.status ?? '')
    const type = String(query.type ?? '')

    return {
      page: Number(query.page) || 1,
      search: String(query.search ?? '').trim(),
      status: STATUS_OPTIONS.some((option) => option.value === status) ? status : '',
      type: TYPE_OPTIONS.some((option) => option.value === type) ? type : '',
    }
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import {
  PaymentMethod,
  PaymentMethodLabel,
  TransactionStatusLabel,
  type TransactionStatus,
} from '#enums/transaction_enum'
import type Order from '#models/order'
import ExcelService, {
  DATETIME_FORMAT,
  RUPIAH_FORMAT,
  excelDate,
  excelNumber,
  sheet,
  type Column,
} from '#services/excel_service'
import ReconciliationService from '#services/reconciliation_service'
import OrderTransformer from '#transformers/order_transformer'
import { reconciliationValidator } from '#validators/reconciliation_validator'
import type { Filters } from '#validators/shared'

const PAYMENT_METHOD_OPTIONS = Object.values(PaymentMethod).map((method) => ({
  value: method,
  label: PaymentMethodLabel[method],
}))

/**
 * What the spreadsheet says about a stuck order.
 *
 * This is the file an admin sits next to the bank statement with, so it leads
 * with the two things the reconciliation turns on — how long the order has
 * been waiting and what the last charge against it did.
 */
const RECONCILIATION_COLUMNS: Column<Order>[] = [
  { header: 'Nomor', width: 20, value: (order) => order.orderNumber },
  { header: 'Pelanggan', width: 24, value: (order) => order.customerName },
  { header: 'Telepon', width: 16, value: (order) => order.customerPhone },
  {
    header: 'Menunggu Sejak',
    width: 18,
    format: DATETIME_FORMAT,
    value: (order) => excelDate(order.createdAt),
  },
  {
    header: 'Status Transaksi',
    width: 18,
    value: (order) => {
      const latest = order.transactions.at(0)

      return latest ? TransactionStatusLabel[latest.status as TransactionStatus] : 'Belum ditagih'
    },
  },
  {
    header: 'Metode Pembayaran',
    width: 18,
    value: (order) => {
      const latest = order.transactions.at(0)

      return latest ? PaymentMethodLabel[latest.paymentMethod as PaymentMethod] : null
    },
  },
  {
    header: 'Referensi Midtrans',
    width: 30,
    value: (order) => order.transactions.at(0)?.midtransOrderId ?? null,
  },
  {
    header: 'Total',
    width: 16,
    format: RUPIAH_FORMAT,
    value: (order) => excelNumber(order.totalPrice),
  },
]

@inject()
export default class ReconciliationController {
  constructor(
    protected reconciliationService: ReconciliationService,
    protected excelService: ExcelService
  ) {}

  async index({ request, inertia }: HttpContext) {
    const filters = this.filtersFrom(request.qs())

    const orders = await this.reconciliationService.getStuckOrders(filters)

    return inertia.render('admin/reconciliation/index', {
      orders: OrderTransformer.paginate(orders.all(), orders.getMeta()).useVariant('toListItem'),
      filters,
      paymentMethodOptions: PAYMENT_METHOD_OPTIONS,
    })
  }

  /**
   * The whole backlog as a spreadsheet — the point of the file is to be
   * checked off against a bank statement away from the screen, so it is
   * deliberately every waiting order rather than the current page.
   */
  async export({ request, response }: HttpContext) {
    const orders = await this.reconciliationService.getStuckOrdersForExport(
      this.filtersFrom(request.qs())
    )

    return this.excelService.download(response, 'rekonsiliasi', [
      sheet({ name: 'Rekonsiliasi', columns: RECONCILIATION_COLUMNS, rows: orders }),
    ])
  }

  async update({ auth, params, request, response, session }: HttpContext) {
    const admin = auth.getUserOrFail()
    const payload = await request.validateUsing(reconciliationValidator)

    const order = await this.reconciliationService.confirmPayment(
      admin,
      String(params.number),
      payload
    )

    session.flash('success', `Pembayaran pesanan ${order.orderNumber} dikonfirmasi manual.`)
    return response.redirect().toRoute('admin.reconciliation.index')
  }

  private filtersFrom(query: Record<string, unknown>): Filters {
    return {
      page: Number(query.page) || 1,
      search: String(query.search ?? '').trim(),
    }
  }
}

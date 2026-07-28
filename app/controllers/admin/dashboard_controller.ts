import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { OrderStatusLabel, type OrderStatus } from '#enums/order_status_enum'
import { OrderTypeLabel, type OrderType } from '#enums/order_type_enum'
import type Order from '#models/order'
import DashboardService, {
  type Breakdown,
  type PickupLoad,
  type Summary,
} from '#services/dashboard_service'
import ExcelService, {
  DATETIME_FORMAT,
  DATE_FORMAT,
  RUPIAH_FORMAT,
  excelDate,
  excelNumber,
  sheet,
  type Sheet,
} from '#services/excel_service'
import OrderTransformer from '#transformers/order_transformer'
import type { SeriesPoint } from '#utils/series'
import { DateTime } from 'luxon'

/**
 * A count-per-category table. The status breakdown and the online/offline
 * split are the same shape, so one definition covers both.
 */
function breakdownSheet(name: string, heading: string, rows: Breakdown[]): Sheet {
  return sheet<Breakdown>({
    name,
    rows,
    columns: [
      { header: heading, width: 26, value: (row) => row.label },
      { header: 'Jumlah', width: 12, value: (row) => row.total },
    ],
  })
}

@inject()
export default class DashboardController {
  constructor(
    protected dashboardService: DashboardService,
    protected excelService: ExcelService
  ) {}

  async index({ inertia }: HttpContext) {
    const [summary, statusBreakdown, typeSplit, revenueTrend, pickupLoad, recentOrders] =
      await this.read()

    return inertia.render('admin/index', {
      summary,
      statusBreakdown,
      typeSplit,
      revenueTrend,
      pickupLoad,
      recentOrders: OrderTransformer.transform(recentOrders),
    })
  }

  /**
   * The dashboard as a workbook, one sheet per panel.
   *
   * Charts are not something an admin can paste into a report; the numbers
   * behind them are. Built from the same six readings the screen is built
   * from, so a file taken into a meeting says what the screen said when it was
   * taken.
   */
  async export({ response }: HttpContext) {
    const [summary, statusBreakdown, typeSplit, revenueTrend, pickupLoad, recentOrders] =
      await this.read()

    return this.excelService.download(response, 'dasbor', [
      this.summarySheet(summary),
      breakdownSheet('Pesanan per Status', 'Status', statusBreakdown),
      breakdownSheet('Online vs Offline', 'Tipe', typeSplit),
      sheet<SeriesPoint>({
        name: 'Tren Pendapatan',
        rows: revenueTrend,
        columns: [
          {
            header: 'Tanggal',
            width: 16,
            format: DATE_FORMAT,
            value: (point) => excelDate(DateTime.fromISO(point.date)),
          },
          { header: 'Pendapatan', width: 18, format: RUPIAH_FORMAT, value: (point) => point.total },
        ],
      }),
      sheet<PickupLoad>({
        name: 'Beban Penjemputan',
        rows: pickupLoad,
        columns: [
          {
            header: 'Tanggal',
            width: 16,
            format: DATE_FORMAT,
            value: (day) => excelDate(DateTime.fromISO(day.date)),
          },
          { header: 'Terjadwal', width: 14, value: (day) => day.booked },
          { header: 'Kapasitas', width: 14, value: (day) => day.capacity },
          { header: 'Sisa', width: 14, value: (day) => day.capacity - day.booked },
        ],
      }),
      sheet<Order>({
        name: 'Pesanan Terbaru',
        rows: recentOrders,
        columns: [
          { header: 'Nomor', width: 20, value: (order) => order.orderNumber },
          { header: 'Pelanggan', width: 24, value: (order) => order.customerName },
          { header: 'Tipe', width: 12, value: (order) => OrderTypeLabel[order.type as OrderType] },
          {
            header: 'Status',
            width: 24,
            value: (order) => OrderStatusLabel[order.status as OrderStatus],
          },
          {
            header: 'Dibuat',
            width: 18,
            format: DATETIME_FORMAT,
            value: (order) => excelDate(order.createdAt),
          },
          {
            header: 'Total',
            width: 16,
            format: RUPIAH_FORMAT,
            value: (order) => excelNumber(order.totalPrice),
          },
        ],
      }),
    ])
  }

  /**
   * Every reading the dashboard needs, taken at once. Shared by the screen and
   * the export so the two can never drift into disagreeing about what the
   * dashboard is.
   */
  private read() {
    return Promise.all([
      this.dashboardService.getSummary(),
      this.dashboardService.getStatusBreakdown(),
      this.dashboardService.getTypeSplit(),
      this.dashboardService.getRevenueTrend(),
      this.dashboardService.getPickupLoad(),
      this.dashboardService.getRecentOrders(),
    ])
  }

  private summarySheet(summary: Summary): Sheet {
    return sheet<{ label: string; value: string | number }>({
      name: 'Ringkasan',
      rows: [
        { label: 'Total Pesanan', value: summary.totalOrders },
        { label: 'Pesanan Berjalan', value: summary.activeOrders },
        { label: 'Pesanan Selesai', value: summary.completedOrders },
        { label: 'Menunggu Pelunasan', value: summary.awaitingPayment },
        { label: 'Pendapatan', value: summary.revenue },
        { label: 'Pelanggan', value: summary.customers },
        { label: 'Petugas', value: summary.staff },
      ],
      columns: [
        { header: 'Metrik', width: 26, value: (row) => row.label },
        { header: 'Nilai', width: 24, value: (row) => row.value },
      ],
    })
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ServiceCategoryLabel, type ServiceCategory } from '#enums/service_enum'
import ExcelService, {
  DATE_FORMAT,
  RUPIAH_FORMAT,
  excelDate,
  sheet,
  type Sheet,
} from '#services/excel_service'
import ReportService, {
  type MoneyBreakdown,
  type Report,
  type ServiceRanking,
} from '#services/report_service'
import type { SeriesPoint } from '#utils/series'
import { formatRupiah } from '#utils/currency'
import { reportValidator } from '#validators/report_validator'
import { DateTime } from 'luxon'

/**
 * A breakdown of revenue by some dimension — payment method or order type.
 * Both are the same shape, so both sheets come from one definition with only
 * the heading of the first column differing.
 */
function breakdownSheet(name: string, heading: string, rows: MoneyBreakdown[]): Sheet {
  return sheet<MoneyBreakdown>({
    name,
    rows,
    columns: [
      { header: heading, width: 22, value: (row) => row.label },
      { header: 'Pesanan', width: 12, value: (row) => row.orders },
      { header: 'Pendapatan', width: 18, format: RUPIAH_FORMAT, value: (row) => row.revenue },
    ],
  })
}

@inject()
export default class ReportController {
  constructor(
    protected reportService: ReportService,
    protected excelService: ExcelService
  ) {}

  /**
   * The range arrives in the query string, so it is validated from there
   * rather than from a body: the page has to be linkable and bookmarkable for
   * a report to be worth anything.
   */
  async index({ request, inertia }: HttpContext) {
    const range = await reportValidator.validate(request.qs())

    return inertia.render('admin/report/index', {
      report: await this.reportService.getReport(range),
    })
  }

  /**
   * The report as a workbook, one sheet per section of the page.
   *
   * Split across sheets rather than stacked into one, because each section has
   * its own columns and a single sheet holding all five would be a shape no
   * spreadsheet can sort, filter or chart. The range is read the same way the
   * page reads it, so the file covers the window on screen.
   */
  async export({ request, response }: HttpContext) {
    const range = await reportValidator.validate(request.qs())
    const report = await this.reportService.getReport(range)

    return this.excelService.download(response, 'laporan-pendapatan', [
      this.summarySheet(report),
      sheet<SeriesPoint>({
        name: 'Pendapatan Harian',
        rows: report.series,
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
      breakdownSheet('Metode Pembayaran', 'Metode', report.byPaymentMethod),
      breakdownSheet('Tipe Pesanan', 'Tipe', report.byType),
      sheet<ServiceRanking>({
        name: 'Layanan Terlaris',
        rows: report.topServices,
        columns: [
          { header: 'Layanan', width: 30, value: (service) => service.name },
          {
            header: 'Kategori',
            width: 18,
            value: (service) => ServiceCategoryLabel[service.category as ServiceCategory],
          },
          { header: 'Terjual', width: 12, value: (service) => service.orders },
          {
            header: 'Pendapatan',
            width: 18,
            format: RUPIAH_FORMAT,
            value: (service) => service.revenue,
          },
        ],
      }),
    ])
  }

  /**
   * The headline figures, as label-and-value rows.
   *
   * The values are the formatted strings the page prints rather than raw
   * numbers: a summary is six rows nobody adds up, and "Rp 1.200.000" beside
   * "1 Juli 2026 — 31 Juli 2026" reads as a report in a way a column of bare
   * integers would not.
   */
  private summarySheet(report: Report): Sheet {
    return sheet<{ label: string; value: string }>({
      name: 'Ringkasan',
      rows: [
        { label: 'Periode', value: report.label },
        { label: 'Dari', value: report.from },
        { label: 'Sampai', value: report.to },
        { label: 'Total Pendapatan', value: formatRupiah(report.totalRevenue) },
        { label: 'Pesanan Terbayar', value: String(report.paidOrders) },
        { label: 'Rata-rata per Pesanan', value: formatRupiah(report.averageOrderValue) },
      ],
      columns: [
        { header: 'Metrik', width: 26, value: (row) => row.label },
        { header: 'Nilai', width: 36, value: (row) => row.value },
      ],
    })
  }
}

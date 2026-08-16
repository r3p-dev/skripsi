import AnalyticsService from '#services/analytics_service'
import { SPREADSHEET_CONTENT_TYPE, toWorkbook, type SheetColumn } from '#utils/spreadsheet'
import { reportRangeValidator } from '#validators/admin_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

const DEFAULT_RANGE_DAYS = 30

type SeriesRow = { date: string; label: string; total: number }

const exportColumns: SheetColumn<SeriesRow>[] = [
  { header: 'Tanggal', value: (row) => row.date },
  { header: 'Pendapatan', value: (row) => row.total },
]

@inject()
export default class ReportController {
  constructor(protected analyticsService: AnalyticsService) {}

  async index({ inertia, request }: HttpContext) {
    const { from, to } = await this.#range(request)

    return inertia.render('admin/report/index', {
      report: await this.analyticsService.report(from, to),
    })
  }

  async export({ request, response }: HttpContext) {
    const { from, to } = await this.#range(request)
    const report = await this.analyticsService.report(from, to)
    const workbook = await toWorkbook('Pendapatan', exportColumns, report.series)

    response.header('Content-Type', SPREADSHEET_CONTENT_TYPE)
    response.header(
      'Content-Disposition',
      `attachment; filename="laporan-${report.from}-${report.to}.xlsx"`
    )

    return response.send(workbook)
  }

  async #range(request: HttpContext['request']) {
    const payload = await request.validateUsing(reportRangeValidator)

    const to = payload.to ?? DateTime.now()
    const from = payload.from ?? to.minus({ days: DEFAULT_RANGE_DAYS - 1 })

    return from <= to ? { from, to } : { from: to, to: from }
  }
}

import { OrderType, OrderTypeLabel } from '#enums/order_type_enum'
import { PaymentMethod, PaymentMethodLabel, TransactionStatus } from '#enums/transaction_enum'
import { buildDailySeries, type SeriesPoint } from '#utils/series'
import type { ReportRange } from '#validators/report_validator'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/**
 * The window a report covers when nothing is asked for: the last 30 days,
 * which is the period the shop settles its own books over.
 */
const DEFAULT_RANGE_DAYS = 30

/**
 * How many services the "most requested" table lists. Beyond this the tail is
 * noise for a catalogue of this size.
 */
const TOP_SERVICE_LIMIT = 5

export type MoneyBreakdown = {
  value: string
  label: string
  orders: number
  revenue: number
}

export type ServiceRanking = {
  id: number
  name: string
  category: string
  orders: number
  revenue: number
}

export type Report = {
  from: string
  to: string
  label: string
  totalRevenue: number
  paidOrders: number
  averageOrderValue: number
  series: SeriesPoint[]
  byPaymentMethod: MoneyBreakdown[]
  byType: MoneyBreakdown[]
  topServices: ServiceRanking[]
}

/**
 * Builds the revenue and activity report the admin screen prints.
 *
 * Every figure is restricted to orders that were actually paid for. An order
 * still awaiting payment is work in progress, not revenue, and counting it
 * would overstate every total on the page.
 */
export default class ReportService {
  /**
   * Resolves the requested window, falling back to the last 30 days, and
   * swapping the ends if they arrive the wrong way round rather than
   * returning an empty report for what is obviously a typo.
   */
  resolveRange(range: ReportRange): { from: DateTime; to: DateTime } {
    const to = (range.to ?? DateTime.now()).startOf('day')
    const from = (range.from ?? to.minus({ days: DEFAULT_RANGE_DAYS - 1 })).startOf('day')

    return from > to ? { from: to, to: from } : { from, to }
  }

  async getReport(range: ReportRange): Promise<Report> {
    const { from, to } = this.resolveRange(range)

    const [totals, series, byPaymentMethod, byType, topServices] = await Promise.all([
      this.getTotals(from, to),
      this.getSeries(from, to),
      this.getByPaymentMethod(from, to),
      this.getByType(from, to),
      this.getTopServices(from, to),
    ])

    return {
      from: from.toISODate()!,
      to: to.toISODate()!,
      label: `${from.setLocale('id').toFormat('d LLLL yyyy')} — ${to.setLocale('id').toFormat('d LLLL yyyy')}`,
      totalRevenue: totals.revenue,
      paidOrders: totals.orders,
      averageOrderValue: totals.orders > 0 ? Math.round(totals.revenue / totals.orders) : 0,
      series,
      byPaymentMethod,
      byType,
      topServices,
    }
  }

  private async getTotals(from: DateTime, to: DateTime) {
    const rows = await this.paidOrders(from, to)
      .sum('orders.total_price as revenue')
      .countDistinct('orders.id as orders')

    return {
      revenue: Number(rows[0]?.revenue ?? 0),
      orders: Number(rows[0]?.orders ?? 0),
    }
  }

  private async getSeries(from: DateTime, to: DateTime): Promise<SeriesPoint[]> {
    const rows = await this.paidOrders(from, to)
      .select(db.raw(`to_char(orders.created_at, 'YYYY-MM-DD') as date`))
      .sum('orders.total_price as total')
      .groupByRaw(`to_char(orders.created_at, 'YYYY-MM-DD')`)

    return buildDailySeries(
      rows.map((row) => ({ date: String(row.date), total: Number(row.total) })),
      from,
      to
    )
  }

  /**
   * Revenue per payment method. Cash and debit are recorded at the counter,
   * QRIS comes back from Midtrans — the mix is what tells an admin how much
   * money is physically in the shop at the end of the day.
   */
  private async getByPaymentMethod(from: DateTime, to: DateTime): Promise<MoneyBreakdown[]> {
    const rows = await this.paidOrders(from, to)
      .select('transactions.payment_method')
      .sum('orders.total_price as revenue')
      .countDistinct('orders.id as orders')
      .groupBy('transactions.payment_method')

    const totals = new Map(rows.map((row) => [String(row.payment_method), row]))

    return Object.values(PaymentMethod).map((method) => {
      const row = totals.get(method)

      return {
        value: method,
        label: PaymentMethodLabel[method],
        orders: Number(row?.orders ?? 0),
        revenue: Number(row?.revenue ?? 0),
      }
    })
  }

  private async getByType(from: DateTime, to: DateTime): Promise<MoneyBreakdown[]> {
    const rows = await this.paidOrders(from, to)
      .select('orders.type')
      .sum('orders.total_price as revenue')
      .countDistinct('orders.id as orders')
      .groupBy('orders.type')

    const totals = new Map(rows.map((row) => [String(row.type), row]))

    return Object.values(OrderType).map((type) => {
      const row = totals.get(type)

      return {
        value: type,
        label: OrderTypeLabel[type],
        orders: Number(row?.orders ?? 0),
        revenue: Number(row?.revenue ?? 0),
      }
    })
  }

  /**
   * The services that earned the most over the window.
   *
   * Summed from `order_items.subtotal` rather than from the catalogue's
   * current price, because a line keeps the price it was quoted at and a
   * later price change must not rewrite history.
   */
  private async getTopServices(from: DateTime, to: DateTime): Promise<ServiceRanking[]> {
    const rows = await db
      .from('order_items')
      .join('orders', 'orders.id', 'order_items.order_id')
      .join('services', 'services.id', 'order_items.service_id')
      .join('transactions', 'transactions.order_id', 'orders.id')
      .select('services.id', 'services.name', 'services.category')
      .sum('order_items.subtotal as revenue')
      .count('order_items.id as orders')
      .where('transactions.status', TransactionStatus.PAID)
      .whereBetween('orders.created_at', [from.toSQL()!, to.endOf('day').toSQL()!])
      .groupBy('services.id', 'services.name', 'services.category')
      .orderBy('revenue', 'desc')
      .limit(TOP_SERVICE_LIMIT)

    return rows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      category: String(row.category),
      orders: Number(row.orders),
      revenue: Number(row.revenue),
    }))
  }

  /**
   * The base query every figure is built on: orders created inside the window
   * that carry a paid transaction.
   *
   * The join can return an order twice if it was charged more than once and
   * more than one charge settled, which is why the counts are distinct.
   */
  private paidOrders(from: DateTime, to: DateTime) {
    return db
      .from('orders')
      .join('transactions', 'transactions.order_id', 'orders.id')
      .where('transactions.status', TransactionStatus.PAID)
      .whereBetween('orders.created_at', [from.toSQL()!, to.endOf('day').toSQL()!])
  }
}

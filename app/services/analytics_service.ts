import Order from '#models/order'
import { DAILY_PICKUP_LIMIT } from '#services/order_service'
import { OrderStatus, OrderStatusLabel, OrderType, OrderTypeLabel } from '#enums/order_enum'
import { PaymentMethod, PaymentMethodLabel, TransactionStatus } from '#enums/transaction_enum'
import { Role } from '#enums/role_enum'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export type Breakdown = { value: string; label: string; total: number }

export type MoneyBreakdown = { value: string; label: string; orders: number; revenue: number }

export type SeriesPoint = { date: string; label: string; total: number }

const TREND_DAYS = 14
const PICKUP_DAYS = 7
const RECENT_ORDERS = 8

const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.PICKUP_SCHEDULED,
  OrderStatus.IN_PICKUP,
  OrderStatus.IN_INSPECTION,
  OrderStatus.AWAITING_PAYMENT,
  OrderStatus.IN_CLEANING,
  OrderStatus.CLEANING_DONE,
  OrderStatus.IN_DELIVERY,
]

export default class AnalyticsService {
  async dashboard() {
    const [summary, statusBreakdown, typeSplit, revenueTrend, pickupLoad, recentOrders] =
      await Promise.all([
        this.#summary(),
        this.#statusBreakdown(),
        this.#typeSplit(),
        this.#revenueTrend(),
        this.#pickupLoad(),
        Order.query().orderBy('created_at', 'desc').limit(RECENT_ORDERS),
      ])

    return { summary, statusBreakdown, typeSplit, revenueTrend, pickupLoad, recentOrders }
  }

  async report(from: DateTime, to: DateTime) {
    const start = from.startOf('day')
    const end = to.endOf('day')

    const [totals, series, byPaymentMethod, byType, topServices] = await Promise.all([
      this.#reportTotals(start, end),
      this.#reportSeries(start, end),
      this.#reportByPaymentMethod(start, end),
      this.#reportByType(start, end),
      this.#topServices(start, end),
    ])

    return {
      from: start.toISODate()!,
      to: end.toISODate()!,
      label: `${start.setLocale('id').toLocaleString(DateTime.DATE_MED)} – ${end
        .setLocale('id')
        .toLocaleString(DateTime.DATE_MED)}`,
      totalRevenue: totals.revenue,
      paidOrders: totals.orders,
      averageOrderValue: totals.orders === 0 ? 0 : Math.round(totals.revenue / totals.orders),
      series,
      byPaymentMethod,
      byType,
      topServices,
    }
  }

  async #summary() {
    const [orders, active, completed, awaiting, revenue, roles] = await Promise.all([
      this.#count(db.from('orders')),
      this.#count(db.from('orders').whereIn('status', ACTIVE_STATUSES)),
      this.#count(db.from('orders').where('status', OrderStatus.COMPLETED)),
      this.#count(db.from('orders').where('status', OrderStatus.AWAITING_PAYMENT)),
      this.#paidRevenue(),
      db.from('users').select('role').count('* as total').groupBy('role'),
    ])

    const byRole = Object.fromEntries(roles.map((row) => [row.role, Number(row.total)]))

    return {
      totalOrders: orders,
      activeOrders: active,
      completedOrders: completed,
      awaitingPayment: awaiting,
      revenue,
      customers: byRole[Role.CUSTOMER] ?? 0,
      staff: byRole[Role.STAFF] ?? 0,
    }
  }

  async #statusBreakdown(): Promise<Breakdown[]> {
    const rows = await db.from('orders').select('status').count('* as total').groupBy('status')
    const totals = new Map(rows.map((row) => [row.status as string, Number(row.total)]))

    return Object.values(OrderStatus).map((status) => ({
      value: status,
      label: OrderStatusLabel[status],
      total: totals.get(status) ?? 0,
    }))
  }

  async #typeSplit(): Promise<Breakdown[]> {
    const rows = await db.from('orders').select('type').count('* as total').groupBy('type')
    const totals = new Map(rows.map((row) => [row.type as string, Number(row.total)]))

    return Object.values(OrderType).map((type) => ({
      value: type,
      label: OrderTypeLabel[type],
      total: totals.get(type) ?? 0,
    }))
  }

  async #revenueTrend(): Promise<SeriesPoint[]> {
    const start = DateTime.now()
      .minus({ days: TREND_DAYS - 1 })
      .startOf('day')

    const rows = await db
      .from('transactions')
      .join('orders', 'orders.id', 'transactions.order_id')
      .where('transactions.status', TransactionStatus.PAID)
      .where('transactions.created_at', '>=', start.toJSDate())
      .select(db.raw(`date(transactions.created_at) as day`))
      .sum('orders.total_price as total')
      .groupByRaw('date(transactions.created_at)')

    return this.#fillDays(start, TREND_DAYS, this.#toDayTotals(rows))
  }

  async #pickupLoad() {
    const start = DateTime.now().startOf('day')

    const rows = await db
      .from('orders')
      .whereNotNull('pickup_date')
      .where('pickup_date', '>=', start.toSQLDate()!)
      .where('pickup_date', '<', start.plus({ days: PICKUP_DAYS }).toSQLDate()!)
      .whereNot('status', OrderStatus.CANCELLED)
      .select('pickup_date')
      .count('* as total')
      .groupBy('pickup_date')

    const booked = new Map(
      rows.map((row) => [
        DateTime.fromJSDate(new Date(row.pickup_date)).toISODate(),
        Number(row.total),
      ])
    )

    return Array.from({ length: PICKUP_DAYS }, (_, offset) => {
      const day = start.plus({ days: offset })
      const date = day.toISODate()!

      return {
        date,
        label: day.setLocale('id').toFormat('ccc d'),
        booked: booked.get(date) ?? 0,
        capacity: DAILY_PICKUP_LIMIT,
      }
    })
  }

  async #reportTotals(start: DateTime, end: DateTime) {
    const row = await this.#paidQuery(start, end)
      .sum('orders.total_price as revenue')
      .countDistinct('orders.id as orders')
      .first()

    return {
      revenue: Math.round(Number(row?.revenue ?? 0)),
      orders: Number(row?.orders ?? 0),
    }
  }

  async #reportSeries(start: DateTime, end: DateTime): Promise<SeriesPoint[]> {
    const rows = await this.#paidQuery(start, end)
      .select(db.raw(`date(transactions.created_at) as day`))
      .sum('orders.total_price as total')
      .groupByRaw('date(transactions.created_at)')

    const days = Math.max(1, Math.ceil(end.diff(start, 'days').days))

    return this.#fillDays(start, days, this.#toDayTotals(rows))
  }

  async #reportByPaymentMethod(start: DateTime, end: DateTime): Promise<MoneyBreakdown[]> {
    const rows = await this.#paidQuery(start, end)
      .select('transactions.payment_method')
      .sum('orders.total_price as revenue')
      .countDistinct('orders.id as orders')
      .groupBy('transactions.payment_method')

    const totals = new Map(rows.map((row) => [row.payment_method as string, row]))

    return Object.values(PaymentMethod).map((method) => ({
      value: method,
      label: PaymentMethodLabel[method],
      orders: Number(totals.get(method)?.orders ?? 0),
      revenue: Math.round(Number(totals.get(method)?.revenue ?? 0)),
    }))
  }

  async #reportByType(start: DateTime, end: DateTime): Promise<MoneyBreakdown[]> {
    const rows = await this.#paidQuery(start, end)
      .select('orders.type')
      .sum('orders.total_price as revenue')
      .countDistinct('orders.id as orders')
      .groupBy('orders.type')

    const totals = new Map(rows.map((row) => [row.type as string, row]))

    return Object.values(OrderType).map((type) => ({
      value: type,
      label: OrderTypeLabel[type],
      orders: Number(totals.get(type)?.orders ?? 0),
      revenue: Math.round(Number(totals.get(type)?.revenue ?? 0)),
    }))
  }

  async #topServices(start: DateTime, end: DateTime) {
    const rows = await db
      .from('order_items')
      .join('orders', 'orders.id', 'order_items.order_id')
      .join('transactions', 'transactions.order_id', 'orders.id')
      .join('catalogues', 'catalogues.id', 'order_items.catalogue_id')
      .where('transactions.status', TransactionStatus.PAID)
      .whereBetween('transactions.created_at', [start.toJSDate(), end.toJSDate()])
      .select('catalogues.id', 'catalogues.name', 'catalogues.category')
      .sum('order_items.subtotal as revenue')
      .count('order_items.id as orders')
      .groupBy('catalogues.id', 'catalogues.name', 'catalogues.category')
      .orderByRaw('sum(order_items.subtotal) desc')
      .limit(10)

    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name as string,
      category: row.category as string,
      orders: Number(row.orders),
      revenue: Math.round(Number(row.revenue)),
    }))
  }

  /**
   * Settled money in a window, joined back to the order it paid for.
   */
  #paidQuery(start: DateTime, end: DateTime) {
    return db
      .from('transactions')
      .join('orders', 'orders.id', 'transactions.order_id')
      .where('transactions.status', TransactionStatus.PAID)
      .whereBetween('transactions.created_at', [start.toJSDate(), end.toJSDate()])
  }

  async #paidRevenue(): Promise<number> {
    const row = await db
      .from('transactions')
      .join('orders', 'orders.id', 'transactions.order_id')
      .where('transactions.status', TransactionStatus.PAID)
      .sum('orders.total_price as total')
      .first()

    return Math.round(Number(row?.total ?? 0))
  }

  async #count(query: ReturnType<typeof db.from>): Promise<number> {
    const row = await query.count('* as total').first()

    return Number(row?.total ?? 0)
  }

  #toDayTotals(rows: Record<string, unknown>[]): Map<string, number> {
    return new Map(
      rows.map((row) => [
        DateTime.fromJSDate(new Date(row.day as string)).toISODate()!,
        Math.round(Number(row.total ?? 0)),
      ])
    )
  }

  #fillDays(start: DateTime, days: number, totals: Map<string, number>): SeriesPoint[] {
    return Array.from({ length: days }, (_, offset) => {
      const day = start.plus({ days: offset })
      const date = day.toISODate()!

      return {
        date,
        label: day.setLocale('id').toFormat('d MMM'),
        total: totals.get(date) ?? 0,
      }
    })
  }
}

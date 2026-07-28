import { OrderStatus, OrderStatusLabel } from '#enums/order_status_enum'
import { OrderType, OrderTypeLabel } from '#enums/order_type_enum'
import { Role } from '#enums/role_enum'
import { TransactionStatus } from '#enums/transaction_enum'
import Order from '#models/order'
import Transaction from '#models/transaction'
import User from '#models/user'
import { DAILY_PICKUP_LIMIT } from '#services/order_service'
import { formatRupiah } from '#utils/currency'
import { buildDailySeries, eachDay, type SeriesPoint } from '#utils/series'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/**
 * How far back the dashboard's revenue line reaches. Two weeks is short enough
 * that a quiet Tuesday is still visible and long enough to show a trend.
 */
const REVENUE_TREND_DAYS = 14

/**
 * How far ahead the pickup load looks. The team books at most
 * `DAILY_PICKUP_LIMIT` collections a day, and a week is as far as anyone
 * plans staffing.
 */
const PICKUP_FORECAST_DAYS = 7

/**
 * Orders that are still moving through the shop, as opposed to finished or
 * abandoned. What "in progress" means on the dashboard.
 */
const ACTIVE_STATUSES: string[] = [
  OrderStatus.PICKUP_SCHEDULED,
  OrderStatus.IN_PICKUP,
  OrderStatus.IN_INSPECTION,
  OrderStatus.AWAITING_PAYMENT,
  OrderStatus.IN_CLEANING,
  OrderStatus.IN_DELIVERY,
]

export type Summary = {
  totalOrders: number
  activeOrders: number
  completedOrders: number
  awaitingPayment: number
  revenue: string
  revenueValue: number
  customers: number
  staff: number
}

/**
 * A slice of a breakdown chart: the raw enum value to key colours on, the
 * Indonesian label to print, and the count.
 */
export type Breakdown = {
  value: string
  label: string
  total: number
}

export type PickupLoad = {
  date: string
  label: string
  booked: number
  capacity: number
}

/**
 * Reads the operational numbers behind the admin dashboard.
 *
 * Everything here is read-only aggregation over data other parts of the app
 * already write, so nothing in this service can change an order.
 */
export default class DashboardService {
  /**
   * The headline figures across the whole lifetime of the shop.
   */
  async getSummary(): Promise<Summary> {
    const [orderCounts, revenue, userCounts] = await Promise.all([
      db
        .from('orders')
        .select('status')
        .count('* as total')
        .groupBy('status')
        .then((rows) => new Map(rows.map((row) => [String(row.status), Number(row.total)]))),
      this.getRevenueTotal(),
      db
        .from('users')
        .select('role')
        .count('* as total')
        .groupBy('role')
        .then((rows) => new Map(rows.map((row) => [String(row.role), Number(row.total)]))),
    ])

    const countFor = (statuses: string[]) =>
      statuses.reduce((total, status) => total + (orderCounts.get(status) ?? 0), 0)

    return {
      totalOrders: [...orderCounts.values()].reduce((total, count) => total + count, 0),
      activeOrders: countFor(ACTIVE_STATUSES),
      completedOrders: countFor([OrderStatus.COMPLETED]),
      awaitingPayment: countFor([OrderStatus.AWAITING_PAYMENT]),
      revenue: formatRupiah(revenue),
      revenueValue: revenue,
      customers: userCounts.get(Role.CUSTOMER) ?? 0,
      staff: userCounts.get(Role.STAFF) ?? 0,
    }
  }

  /**
   * How many orders sit in each status right now, in lifecycle order rather
   * than by size, so the chart reads as the pipeline it describes.
   */
  async getStatusBreakdown(): Promise<Breakdown[]> {
    const rows = await db.from('orders').select('status').count('* as total').groupBy('status')
    const totals = new Map(rows.map((row) => [String(row.status), Number(row.total)]))

    return Object.values(OrderStatus).map((status) => ({
      value: status,
      label: OrderStatusLabel[status],
      total: totals.get(status) ?? 0,
    }))
  }

  /**
   * The walk-in versus app-booking split — the reason `orders.type` exists.
   */
  async getTypeSplit(): Promise<Breakdown[]> {
    const rows = await db.from('orders').select('type').count('* as total').groupBy('type')
    const totals = new Map(rows.map((row) => [String(row.type), Number(row.total)]))

    return Object.values(OrderType).map((type) => ({
      value: type,
      label: OrderTypeLabel[type],
      total: totals.get(type) ?? 0,
    }))
  }

  /**
   * Paid revenue per day over the recent past.
   *
   * Dated by when the order was created rather than when Midtrans confirmed
   * it, so a payment that lands the next morning still counts against the day
   * the work was taken in.
   */
  async getRevenueTrend(days: number = REVENUE_TREND_DAYS): Promise<SeriesPoint[]> {
    const to = DateTime.now().startOf('day')
    const from = to.minus({ days: days - 1 })

    const rows = await db
      .from('orders')
      .select(db.raw(`to_char(orders.created_at, 'YYYY-MM-DD') as date`))
      .sum('orders.total_price as total')
      .whereIn('orders.id', this.paidOrderIds())
      .where('orders.created_at', '>=', from.toSQL()!)
      .groupByRaw(`to_char(orders.created_at, 'YYYY-MM-DD')`)

    return buildDailySeries(
      rows.map((row) => ({ date: String(row.date), total: Number(row.total) })),
      from,
      to
    )
  }

  /**
   * Pickups already booked for each of the coming days against the daily cap,
   * so an admin can see a day filling up before customers start being refused.
   */
  async getPickupLoad(days: number = PICKUP_FORECAST_DAYS): Promise<PickupLoad[]> {
    const from = DateTime.now().startOf('day')
    const to = from.plus({ days: days - 1 })

    const rows = await db
      .from('orders')
      .select(db.raw(`to_char(pickup_date, 'YYYY-MM-DD') as date`))
      .count('* as total')
      .where('status', OrderStatus.PICKUP_SCHEDULED)
      .whereBetween('pickup_date', [from.toISODate()!, to.toISODate()!])
      .groupByRaw(`to_char(pickup_date, 'YYYY-MM-DD')`)

    const booked = new Map(rows.map((row) => [String(row.date), Number(row.total)]))

    return eachDay(from, to).map((date) => ({
      date,
      label: DateTime.fromISO(date).setLocale('id').toFormat('d LLL'),
      booked: booked.get(date) ?? 0,
      capacity: DAILY_PICKUP_LIMIT,
    }))
  }

  /**
   * The latest orders to arrive, whichever way they arrived, so the dashboard
   * opens on something happening rather than on a set of totals.
   */
  async getRecentOrders(limit = 5): Promise<Order[]> {
    return Order.query().orderBy('created_at', 'desc').limit(limit)
  }

  /**
   * Total revenue actually collected.
   *
   * Counted from the order's own total rather than by summing transactions:
   * a QRIS charge that expired and was retried leaves two transaction rows for
   * one order, and only one payment ever changed hands.
   */
  async getRevenueTotal(): Promise<number> {
    const result = await db
      .from('orders')
      .sum('total_price as total')
      .whereIn('id', this.paidOrderIds())

    return Number(result[0]?.total ?? 0)
  }

  /**
   * Sub-query for the orders that have been paid for. Shared by every revenue
   * figure so they can never disagree about what "paid" means.
   */
  private paidOrderIds() {
    return db
      .from('transactions')
      .select('order_id')
      .where('status', TransactionStatus.PAID)
      .distinct()
  }

  /**
   * Convenience wrappers used by the profile screen, where an admin's own
   * order count would always read zero.
   */
  async getTeamSize(): Promise<number> {
    const result = await User.query().where('role', Role.STAFF).count('* as total')

    return Number(result[0].$extras.total)
  }

  async getTransactionCount(): Promise<number> {
    const result = await Transaction.query()
      .where('status', TransactionStatus.PAID)
      .count('* as total')

    return Number(result[0].$extras.total)
  }
}

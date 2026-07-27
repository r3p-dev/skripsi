import type { OrderStatus } from '#enums/order_status_enum'
import type { DateTime } from 'luxon'

/**
 * Coordinates used as the starting point for route calculation.
 */
type RoutePlanInput = {
  originLat: number
  originLng: number
}

/**
 * Minimal order data required for route planning.
 */
export type RouteOrder = {
  id: number
  orderNumber: string
  status: OrderStatus
  pickupDate: DateTime | null
  address: {
    name: string
    phone: string
    street: string
    latitude: number
    longitude: number
    note?: string
  } | null
}

/**
 * Route item enriched with calculated distance.
 */
export type RouteItem = RouteOrder & {
  distanceKm: number
}

export default class RouteService {
  /**
   * Creates a route list sorted by the nearest destination first.
   *
   * The route is currently distance-based and does not consider
   * traffic, delivery priority, or route optimization algorithms.
   */
  buildRoutePlanForOrders(orders: RouteOrder[], input: RoutePlanInput): RouteItem[] {
    return orders
      .map((order) => ({
        ...order,
        distanceKm: order.address
          ? this.calculateDistanceInKm(
              input.originLat,
              input.originLng,
              order.address.latitude,
              order.address.longitude
            )
          : Number.POSITIVE_INFINITY,
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }

  /**
   * Calculates the straight-line distance between two coordinates
   * using the Haversine formula.
   *
   * This method is suitable for distance estimation but does not
   * represent actual road distance.
   */
  calculateDistanceInKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const earthRadiusKm = 6371
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) ** 2

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return Math.round(earthRadiusKm * c * 100) / 100
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

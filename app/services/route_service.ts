import { OrderStatus } from '#enums/order_status_enum'
import type { DateTime } from 'luxon'

/**
 * Route planning input used by the route service.
 */
type RoutePlanInput = {
  originLat: number
  originLng: number
  selectedDate: DateTime
}

/**
 * Normalized route item returned for the staff route list.
 */
type RouteItem = {
  id: number
  orderNumber: string
  distanceKm: number
  pickupDate: DateTime | null
  label: 'Jemput' | 'Antar'
}

/**
 * Minimal order shape required by the route planner.
 */
type RouteOrder = {
  id: number
  orderNumber: string
  pickupDate: DateTime | null
  status: string
  address?: {
    latitude: number | null
    longitude: number | null
  } | null
}

export default class RouteService {
  /**
   * Build the daily route plan for pickup and delivery orders.
   * Items are sorted by distance from the starting point.
   *
   * @param orders - Orders that should be considered for the route plan.
   * @param input - Route planning input including the origin coordinates and selected date.
   * @returns A sorted list of route items ready to be displayed to staff.
   */
  buildRoutePlanForOrders(orders: RouteOrder[], input: RoutePlanInput): RouteItem[] {
    return orders
      .filter((order) => order.pickupDate?.hasSame(input.selectedDate, 'day'))
      .map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        pickupDate: order.pickupDate,
        label: order.status === OrderStatus.IN_DELIVERY ? ('Antar' as const) : ('Jemput' as const),
        distanceKm: this.calculateDistanceInKm(
          input.originLat,
          input.originLng,
          order.address?.latitude ?? 0,
          order.address?.longitude ?? 0
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }

  /**
   * Calculate the great-circle distance between two geographic coordinates
   * using the Haversine formula.
   *
   * @param lat1 - Origin latitude.
   * @param lon1 - Origin longitude.
   * @param lat2 - Destination latitude.
   * @param lon2 - Destination longitude.
   * @returns Distance in kilometers rounded to two decimal places.
   */
  calculateDistanceInKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return Math.round(R * c * 100) / 100
  }

  /**
   * Convert an angle from degrees to radians.
   *
   * @param degrees - Angle expressed in degrees.
   * @returns Equivalent angle in radians.
   * @private
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

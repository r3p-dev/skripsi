import { DateTime } from 'luxon'
import RouteService from '#services/route_service'
import { OrderStatus } from '#enums/order_status_enum'

const routeService = new RouteService()

const selectedDate = DateTime.fromISO('2026-07-20')
const origin = {
  originLat: -6.9555305,
  originLng: 107.6540353,
  selectedDate,
}

const sampleOrders = [
  {
    id: 1,
    orderNumber: 'ORD-001',
    pickupDate: selectedDate,
    status: OrderStatus.PICKUP_SCHEDULED,
    address: { latitude: -6.9555, longitude: 107.654 },
  },
  {
    id: 2,
    orderNumber: 'ORD-002',
    pickupDate: selectedDate,
    status: OrderStatus.IN_DELIVERY,
    address: { latitude: -6.96, longitude: 107.66 },
  },
  {
    id: 3,
    orderNumber: 'ORD-003',
    pickupDate: selectedDate,
    status: OrderStatus.PICKUP_SCHEDULED,
    address: { latitude: -6.9, longitude: 107.7 },
  },
  {
    id: 4,
    orderNumber: 'ORD-004',
    pickupDate: selectedDate,
    status: OrderStatus.IN_DELIVERY,
    address: { latitude: -6.2, longitude: 108.2 },
  },
] as const

console.log('=== Route plan sample ===')
console.log(
  JSON.stringify(routeService.buildRoutePlanForOrders(sampleOrders as any, origin), null, 2)
)

console.log('\n=== Distance examples ===')
console.log(
  'Nearby pickup distance:',
  routeService.calculateDistanceInKm(origin.originLat, origin.originLng, -6.9555, 107.654)
)
console.log(
  'Far delivery distance:',
  routeService.calculateDistanceInKm(origin.originLat, origin.originLng, -6.2, 108.2)
)

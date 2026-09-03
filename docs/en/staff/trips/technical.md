# Trips — Technical

## Routes

| Method | URL                               | Controller           | Route name           |
| ------ | --------------------------------- | -------------------- | -------------------- |
| GET    | `/staff/tasks/:number/trip/:type` | `staff.Trip.show`    | `staff.trip.show`    |
| POST   | `/staff/tasks/:number/trip/:type` | `staff.Trip.update`  | `staff.trip.update`  |
| DELETE | `/staff/tasks/:number/trip/:type` | `staff.Trip.destroy` | `staff.trip.destroy` |

`:type` is validated by `#taskType`:

```ts
#taskType(value: string) {
  if (!isTripType(value)) {
    throw new vineErrors.E_VALIDATION_ERROR([
      { field: 'type', message: 'Jenis tugas tidak dikenali.' },
    ])
  }
  return value
}
```

`TRIP_TYPES = [PICKUP, DELIVERY]`, narrowed by the `isTripType` type guard.

## Files

| Concern     | Path                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------ |
| Controller  | [app/controllers/staff/trip_controller.ts](../../../../app/controllers/staff/trip_controller.ts) |
| Service     | [app/services/task_service.ts](../../../../app/services/task_service.ts)                         |
| Routing     | [app/services/routing_service.ts](../../../../app/services/routing_service.ts)                   |
| Validator   | `taskPhotoValidator` in [task_validator.ts](../../../../app/validators/task_validator.ts)        |
| Transformer | [route_item_transformer.ts](../../../../app/transformers/route_item_transformer.ts)              |

## Type-driven behaviour

```ts
const COMPLETION_STATUS: Record<TripType, OrderStatus> = {
  [TaskType.PICKUP]: OrderStatus.IN_PICKUP,
  [TaskType.DELIVERY]: OrderStatus.COMPLETED,
}

const COMPLETION_ACTION: Record<TripType, ActionName> = {
  [TaskType.PICKUP]: ActionName.PICKUP,
  [TaskType.DELIVERY]: ActionName.DELIVERY,
}
```

Two lookup tables are the entire difference between the two trip types.

## The queue

```ts
async getTripQueue(user: User): Promise<RouteItem[]> {
  const orders = await this.#claimableQuery(user)
    .whereIn('status', [OrderStatus.PICKUP_SCHEDULED, OrderStatus.IN_DELIVERY])
    .whereNotNull('address_id')
    .preload('address')
    .orderBy('pickup_date', 'asc')

  const stops = orders.filter((o) => o.address).map((order) => ({
    order,
    latitude: Number(order.address.latitude),
    longitude: Number(order.address.longitude),
  }))

  if (stops.length === 0) return []

  const plan = await this.routingService.plan(await this.depot(stops[0]), stops)
  return plan.stops.map(({ stop, distance }) => ({ ...  , distanceMetres: distance }))
}
```

`RouteItem` carries `id`, `orderNumber`, `type` (derived from status),
`pickupDate`, `distanceMetres`.

Depot: `getOperationalAreaCentroid()` (`ST_Centroid(ST_Collect(geometry))`),
falling back to the first stop.

## Routing service

Configured by env: `OSRM_ENABLED`, `OSRM_URL`, `OSRM_PROFILE` (default
`driving`), `OSRM_TIMEOUT_MS` (default `5000`), `OSRM_MAX_TABLE_SIZE`
(default `100`).

```ts
get isEnabled() { return ENABLED && !!BASE_URL }
```

`plan()` sequences stops nearest-neighbour from the depot. `line()` returns a
`RouteLine` with `geometry` for the map.

Every result carries `source: 'osrm' | 'haversine'`. The fallback uses:

```ts
const ROAD_WINDING_FACTOR = 1.3
const AVERAGE_SPEED_MS = 8.3
const EARTH_RADIUS = 6371000
```

so haversine distance × 1.3 approximates road distance, and duration is derived
from average speed. **Degradation is silent by design** — the tab keeps working
when OSRM is down.

## Completing a trip

```ts
async completeTrip(user, order, type, photo) {
  this.#assertHolder(user, order)
  const photoPath = await this.#storePhoto(photo)

  return db.transaction(async (trx) => {
    await this.orderService.transitionTo(order, COMPLETION_STATUS[type], trx)
    await this.#recordAction(order, user, COMPLETION_ACTION[type], trx, photoPath)
    await this.#clearClaim(order, trx)
    return order
  })
}
```

Order of operations matters:

1. `#assertHolder` — throws if another staff member holds the claim.
2. **Photo is stored before the transaction opens.** A rollback therefore leaves
   an orphaned file in `order-actions/`.
3. Status change, action record, and claim clearing are one atomic unit.

`#storePhoto` writes to `order-actions/{uuid}.{ext}` via `photo.moveToDisk`.

## Photo validation

```ts
export const taskPhotoValidator = vine.create({ photo: image() })

// shared.ts
export const image = () => vine.file({ size: '5mb', extnames: ['png', 'jpg', 'jpeg'] })
```

## Action records

`order_actions`
([migration](../../../../database/migrations/1786400000000_create_order_actions_table.ts)):

| Column       | Notes                                      |
| ------------ | ------------------------------------------ |
| `order_id`   | FK → orders, `ON DELETE CASCADE`, indexed  |
| `user_id`    | FK → users, `ON DELETE SET NULL`, nullable |
| `name`       | `ActionName`, indexed                      |
| `photo_path` | nullable                                   |
| `note`       | nullable                                   |

Composite index `['order_id', 'name']`. Photos are served through
`GET /internal/actions/:id/photo`, restricted to staff and admin.

## Edge cases

- **Orders without `address_id` never appear** — `whereNotNull('address_id')`.
- **Delivery goes straight to `completed`**, skipping `cleaning_done`.
- **An invalid `:type` is a validation error**, not a 404.
- **The orphaned-photo window** described above is unguarded.
- `Trip.destroy` calls `release`, which no-ops silently if the caller does not
  hold the claim.
- `plan()` respects `OSRM_MAX_TABLE_SIZE`; beyond it the matrix request is not
  attempted.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)

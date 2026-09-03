# Orders — Technical

## Routes

Registered with `router.resource('orders', ...).except(['edit', 'destroy'])` plus
two extras, all params bound to `number`:

| Method | URL                       | Controller               | Route name                |
| ------ | ------------------------- | ------------------------ | ------------------------- |
| GET    | `/orders`                 | `customer.Order.index`   | `customer.orders.index`   |
| GET    | `/orders/create`          | `customer.Order.create`  | `customer.orders.create`  |
| POST   | `/orders`                 | `customer.Order.store`   | `customer.orders.store`   |
| GET    | `/orders/:number`         | `customer.Order.show`    | `customer.orders.show`    |
| PUT    | `/orders/:number`         | `customer.Order.update`  | `customer.orders.update`  |
| GET    | `/orders/:number/receipt` | `customer.Order.receipt` | `customer.orders.receipt` |

`.params({ orders: 'number' })` makes the route key `order_number`, so URLs read
`/orders/ORD2608-0496`. **`update` is the cancel action** — there is no
`destroy`.

## Files

| Concern     | Path                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| Controller  | [app/controllers/customer/order_controller.ts](../../../../app/controllers/customer/order_controller.ts) |
| Service     | [app/services/order_service.ts](../../../../app/services/order_service.ts)                               |
| Validator   | [app/validators/order_validator.ts](../../../../app/validators/order_validator.ts)                       |
| Transformer | [app/transformers/order_transformer.ts](../../../../app/transformers/order_transformer.ts)               |
| Enums       | [app/enums/order_enum.ts](../../../../app/enums/order_enum.ts)                                           |

## Validator

```ts
export const MAX_ITEMS_PER_ORDER = 10

orderValidator = {
  pickupDate: vine.date().after('today'),
  items: vine.array(orderItem).minLength(1).maxLength(MAX_ITEMS_PER_ORDER),
}

orderItem = {
  type: vine.enum(ItemType), // shoe | bag | helmet
  brand: string.trim().maxLength(50),
  model: string.trim().maxLength(50),
  size: string.trim().maxLength(20),
  material: string.trim().maxLength(50),
  note: string.trim().optional(),
}
```

No catalogue/service selection at this stage — that is inspection's job.

## Creating an order

`createOnlineOrder(user, data)`:

1. `getActiveAddress(user)` — throws on field `form` if absent.
2. `#assertPickupCapacity(data.pickupDate)`.
3. `createWithUniqueOrderNumber(...)` wrapping a transaction that creates the
   `Order` then bulk-inserts items with `Item.createMany`.

Denormalised onto the order at creation:

```ts
addressId:     address.id,
customerName:  address.name,     // snapshot, not a join
customerPhone: address.phone,
type:          OrderType.ONLINE,
status:        OrderStatus.PICKUP_SCHEDULED,
totalPrice:    null,
```

Name and phone are **copied**, so later edits to the address do not rewrite
historical orders.

### Pickup capacity

```ts
export const DAILY_PICKUP_LIMIT = 10

async #assertPickupCapacity(pickupDate) {
  const scheduled = await Order.query()
    .where('pickup_date', pickupDate.toFormat('yyyy-MM-dd'))
    .where('status', OrderStatus.PICKUP_SCHEDULED)
    .count('* as total')
  if (Number(...) >= DAILY_PICKUP_LIMIT) throw E_VALIDATION_ERROR on 'pickupDate'
}
```

Only `pickup_scheduled` rows count, so collected orders release their slot. The
composite index `['status', 'pickup_date']` serves this query.

**This is a check-then-insert, not a lock.** Two simultaneous bookings for the
last slot can both pass. Acceptable at current volume; a transactional lock or
an exclusion constraint would be needed to close it.

### Order numbers

Format `ORD{yyLL}-{sequence}` (e.g. `ORD2608-0496`). `order_number` is `unique`;
`createWithUniqueOrderNumber` retries up to `ORDER_NUMBER_ATTEMPTS = 3` on a
`23505` duplicate, detected via `isDuplicateOrderNumber`.

## State machine

```ts
ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pickup_scheduled: [in_pickup, cancelled],
  in_pickup: [in_inspection],
  in_inspection: [awaiting_payment],
  awaiting_payment: [in_cleaning],
  in_cleaning: [in_delivery, cleaning_done],
  cleaning_done: [completed],
  in_delivery: [completed],
  completed: [],
  cancelled: [],
}
```

`nextStatuses` special-cases `in_cleaning`, collapsing the two options to one
based on deliverability:

```ts
isDeliverable(order) {
  return DELIVERABLE_TYPES.includes(order.type) && order.addressId !== null
}
// DELIVERABLE_TYPES = [ONLINE, WALK_IN_DELIVERY]
```

`transitionTo` returns early when the status is unchanged, then rejects anything
not in `nextStatuses` with `E_VALIDATION_ERROR` on `status`.

## Guards

```ts
canPay(order) // awaiting_payment && Number(totalPrice ?? 0) > 0
canCancel(order) // pickup_scheduled && pickupDate && pickupDate > today
```

`cancelOrder` re-checks `canCancel` server-side before transitioning to
`cancelled` — the UI flag is not trusted.

## Reading orders

- `getCustomerOrders(user)` — `where user_id`, newest first, no preloads.
- `itemSummaries(orderIds)` — one grouped query over `items` returning
  `Map<orderId, "2 Sepatu, 1 Tas">`. Batched deliberately to avoid N+1 on the
  list page.
- `getCustomerOrderByNumber(user, number)` — scoped by `user_id`, preloads
  `address` and `items.orderItems`. Scoping by user is the ownership check;
  another customer's number 404s.

Transformer variants: `toObject` (default), `toQueue`, `toListItem`, `toDetail`.
All relations go through `whenLoaded`, so a missing preload yields nothing rather
than a lazy query.

## Realtime

Order pages subscribe to `orders/{orderNumber}` over SSE. Authorisation in
[start/routes.ts](../../../../start/routes.ts): staff may subscribe to any order,
a customer only to one where `order.userId === user.id`.

## Edge cases

- **`totalPrice` is `null` until inspection**, and the column is nullable.
  Anything summing it must coalesce.
- **`user_id` and `address_id` are nullable** on `orders` — counter orders may
  have neither.
- **Cancel uses `PUT`**, matching the resource route with `destroy` excluded.
- **`pickup_date` is a `date`**, not a timestamp; comparisons use
  `startOf('day')`.
- The pickup-capacity race described above is unguarded by design.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)

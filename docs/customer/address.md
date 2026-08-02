# Customer — Address

Where the van goes. A customer has exactly **one active address**, pinned on a
map, and it must fall inside a service area that is not a circle.

**Code:** [`address_service.ts`](../../app/services/address_service.ts) ·
[`address_controller.ts`](../../app/controllers/customer/address_controller.ts) ·
[`address_validator.ts`](../../app/validators/address_validator.ts) ·
pages [`customer/address/show.tsx`](../../inertia/pages/customer/address/show.tsx),
[`customer/address/create.tsx`](../../inertia/pages/customer/address/create.tsx)

---

## 1. One active address, but every address is kept

The `addresses` table has an `is_active` boolean, and the database enforces the
rule rather than the application:

```sql
CREATE UNIQUE INDEX one_active_address_per_user ON addresses (user_id) WHERE is_active = true
```

There is **no update and no delete**. "Changing your address" creates a new row
and deactivates the old one, inside a transaction:

```ts
// AddressService.replaceActiveAddress
return db.transaction(async (trx) => {
  const currentAddress = await Address.query().where('user_id', user.id).andWhere('is_active', true).first()
  if (currentAddress) await currentAddress.merge({ isActive: false }).useTransaction(trx).save()

  return Address.create({ ...data, userId: user.id, isActive: true }, { client: trx })
})
```

> **Why never update in place:** `orders.address_id` points at the exact row an
> order was collected from, and the FK is `RESTRICT`. If a customer moved house
> and the row were edited, every past order would retroactively claim it was
> collected at the new address — the delivery photo would show a door that is
> not the one named on the record. Superseding rows keeps history honest at the
> cost of a few extra rows per customer.

The partial index means a bug that forgot to deactivate the old row would fail
loudly at insert time instead of leaving two "active" addresses and a coin-flip
about which one the van gets.

### One address, not an address book

The product deliberately does not offer a saved-addresses list. The booking form
has no address picker: it shows the active address with an *Ubah* ("change")
link. Fewer taps on a phone, and no chance of booking against a stale entry.

---

## 2. What an address holds

| Column                  | Notes                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| `name`, `phone`         | **The recipient at that door**, not the account holder                   |
| `street`                | Free text, ≤255 chars                                                    |
| `latitude`, `longitude` | `decimal(10,7)`, set by dragging a map pin                               |
| `note`                  | Optional — landmarks, gate colour, "call on arrival"                     |
| `is_active`             | Exactly one true row per user                                            |

> **Why the recipient's name and phone live on the address, and get copied onto
> the order:** a customer may well be booking on behalf of a partner, a parent,
> or a housemate. `OrderService.createOnlineOrder` copies
> `address.name` / `address.phone` into `orders.customer_name` /
> `customer_phone` — it is whoever is at that door who the driver needs to ask
> for and call, not whoever pays.

---

## 3. The service-area check

`replaceActiveAddress` calls `validateRadius` **before** writing anything. An
address outside the area is refused with:

> "Alamat Anda tidak berada dalam area layanan. Silakan pilih lokasi lain."

attached to a pseudo-field `radius`.

### The geometry

The service area is not a circle. Coverage extends much further north and east
than south and west:

```ts
const SERVICE_CENTER_LATITUDE  = -6.9555305
const SERVICE_CENTER_LONGITUDE = 107.6540353

const DIRECTIONAL_LIMITS_KM = { north: 30, south: 10, east: 30, west: 20 }
```

The allowed distance for a given point is **blended** from the two directional
limits it sits between, weighted by how much of its offset is vertical versus
horizontal:

```ts
const latitudeOffset  = latitude  - SERVICE_CENTER_LATITUDE
const longitudeOffset = longitude - SERVICE_CENTER_LONGITUDE
const totalOffset     = Math.abs(latitudeOffset) + Math.abs(longitudeOffset)

if (totalOffset === 0) return true                     // the shop itself

const verticalWeight   = Math.abs(latitudeOffset)  / totalOffset
const horizontalWeight = Math.abs(longitudeOffset) / totalOffset

const verticalLimit   = latitudeOffset  >= 0 ? limits.north : limits.south
const horizontalLimit = longitudeOffset >= 0 ? limits.east  : limits.west

const maxAllowedDistanceKm = Math.sqrt(
  (verticalLimit * verticalWeight) ** 2 + (horizontalLimit * horizontalWeight) ** 2
)

return routeService.calculateDistanceInKm(centre..., latitude, longitude) <= maxAllowedDistanceKm
```

So:

| Direction from the shop | Allowance                          |
| ----------------------- | ---------------------------------- |
| Due north               | the full 30 km                     |
| Due south               | 10 km                              |
| North-east              | somewhere between 30 and 30 → ~30  |
| South-west              | between 10 and 20, weighted        |

> **Why not just a radius:** Bandung Raya is not symmetrical around the shop.
> A 30 km circle would promise collections in areas the team does not serve;
> a 10 km circle would refuse customers it happily drives to. The asymmetric
> blend approximates the real coverage with four numbers a non-developer can
> reason about and change.

Distance itself is straight-line Haversine from
[`RouteService.calculateDistanceInKm`](../../app/services/route_service.ts),
rounded to two decimals. It ignores roads, rivers and traffic — an estimate, not
a routing engine.

⚠️ The shop coordinates are duplicated in
[`trip_controller.ts`](../../app/controllers/staff/trip_controller.ts) as
`STORE_LATITUDE`/`STORE_LONGITUDE`. Changing one without the other means the
service area is measured from a different origin than staff routes.

---

## 4. Flow

```
GET /address          AddressController.show
  └─ AddressService.getActiveAddress(user)          → may be null
  └─ renders customer/address/show

GET /address/create   AddressController.create
  └─ passes the current address so the map opens on it
  └─ renders customer/address/create   (Leaflet pinpoint map)

POST /address         AddressController.store
  └─ addressValidator          name, phone, street ≤255, lat −90..90, lng −180..180, note?
  └─ AddressService.replaceActiveAddress
       ├─ validateRadius → throws if outside the area
       └─ transaction: deactivate old, insert new
  └─ flash "Berhasil menambahkan alamat." → redirect customer.address.show
```

The map is Leaflet with Google map and satellite tiles, in
[`pinpoint_map.tsx`](../../inertia/components/organisms/pinpoint_map.tsx); a
read-only variant [`static_map.tsx`](../../inertia/components/organisms/static_map.tsx)
renders the pin on the show page and on staff trip cards.

Validator bounds (`−90..90`, `−180..180`) are sanity checks on the coordinate
itself; the *business* constraint is `validateRadius` in the service. That split
is the general convention — see [architecture.md §3](../architecture.md#3-where-logic-is-allowed-to-live).

---

## 5. Interaction with ordering

The booking screen is where a missing address becomes visible. If
`getActiveAddress` returns `null`,
[`customer/order/create.tsx`](../../inertia/pages/customer/order/create.tsx)
renders an empty state — *"Alamat belum tersedia"* — with a button to the address
form, and no booking form at all.

When an order is created, the address id is re-verified server-side against the
signed-in customer:

```ts
// OrderService.createOnlineOrder
const address = await Address.query().where('id', data.addressId).where('user_id', user.id).first()
if (!address) throw E_VALIDATION_ERROR('addressId', 'Alamat penjemputan tidak ditemukan.')
```

> **Why re-check what the page just rendered:** `addressId` arrives as a hidden
> input. Without this, editing that field would let anyone book a collection at a
> stranger's address.

---

## 6. Where to change things

| To change…                       | Edit                                                                  |
| -------------------------------- | --------------------------------------------------------------------- |
| Coverage area                    | `DIRECTIONAL_LIMITS_KM` in [`address_service.ts`](../../app/services/address_service.ts) |
| Shop location                    | `SERVICE_CENTER_*` **and** `STORE_*` in [`trip_controller.ts`](../../app/controllers/staff/trip_controller.ts) |
| Allow multiple saved addresses   | Drop the partial index, replace `replaceActiveAddress`, add a picker to the booking form |
| Refusal message                  | `validateRadius`'s caller in `replaceActiveAddress`                   |

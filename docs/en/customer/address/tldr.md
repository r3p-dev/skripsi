# Address — TL;DR

**A customer has exactly one active address.** Not a list, not a default — one.
Saving a new one replaces the old.

![Saved address with its map pin](../../../assets/customer-address-show-desktop.png)

## The five things to know

1. **One active address per customer**, enforced by a partial unique index in
   the database: `one_active_address_per_user ON addresses (user_id) WHERE is_active = true`.
2. **Replacing does not always delete.** If an order still points at the old
   address it is deactivated (`is_active = false`) instead of removed, so order
   history keeps its delivery location.
3. **The address must fall inside a service area.** This is a real PostGIS
   point-in-polygon test (`ST_Covers`), not a radius.
4. **Map search is proxied, not client-side.** Geocoding goes through the app to
   Nominatim, filtered to the operational area before results are returned.
5. **Address search is rate limited** to 30 requests per minute per user.

## Routes at a glance

| Method | URL                | Purpose                          |
| ------ | ------------------ | -------------------------------- |
| GET    | `/address`         | Show the saved address           |
| GET    | `/address/create`  | The map picker page              |
| POST   | `/address`         | Save, replacing any existing one |
| GET    | `/address/geocode` | Search for a place by name       |
| GET    | `/address/nearby`  | Find landmarks near a point      |

## The gotcha

**Delivery is only offered to customers with an account and a saved address.**
The address is where "deliverable" comes from — an order with no `address_id`
finishes at `cleaning_done` (collect at the shop) instead of `in_delivery`.

Second gotcha: an out-of-area pin fails validation on the **`radius`** field,
which is not a field the customer ever filled in. The message is what matters,
not the field name.

→ Plain-language walkthrough: [guide.md](guide.md)
→ Implementation detail: [technical.md](technical.md)

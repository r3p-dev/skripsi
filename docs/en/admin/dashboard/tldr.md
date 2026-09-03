# Dashboard — TL;DR

A single read-only overview of the whole operation, assembled from **six
parallel queries**.

![Dashboard — summary, trend, pickup load, recent orders](../../../assets/admin-dashboard-index-desktop.png)

## The five things to know

1. **It is read-only.** No actions, no forms — purely a view.
2. **Six queries run in parallel** via `Promise.all`, so the page costs roughly
   one round trip's latency, not six.
3. **Revenue counts settled money only** — transactions with status `paid`,
   joined back to the order they paid for.
4. **The revenue trend covers 14 days**, pickup load looks **7 days ahead**, and
   it lists the **8 most recent orders**.
5. **Missing days are filled with zeroes**, so charts never have gaps.

## What it shows

| Block            | Content                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| Summary          | Total / active / completed / awaiting-payment orders, revenue, customer + staff counts |
| Status breakdown | Every `OrderStatus` with its count                                                     |
| Type split       | Every `OrderType` with its count                                                       |
| Revenue trend    | Daily settled revenue, last 14 days                                                    |
| Pickup load      | Bookings vs capacity, next 7 days                                                      |
| Recent orders    | Latest 8                                                                               |

## Route

`GET /admin` → `admin.dashboard.index`

## The gotcha

**"Active" is a specific list of seven statuses**, not "anything unfinished".
`ACTIVE_STATUSES` excludes `completed` and `cancelled` — so the numbers will not
add up to total orders unless you account for both.

→ Plain-language walkthrough: [guide.md](guide.md)
→ Implementation detail: [technical.md](technical.md)

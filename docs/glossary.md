# Glossary

The application's UI is entirely in Indonesian; the code is in English. This is
the lookup table between the two, plus every enum value in the system.

---

## Roles

| Code      | UI label    | Who they are                                  | Home route              |
| --------- | ----------- | --------------------------------------------- | ----------------------- |
| `customer`| Pelanggan   | A paying customer, self-registered            | `customer.order.create` |
| `staff`   | Petugas     | Field/counter staff. Created by an admin only | `staff.trip.index`      |
| `admin`   | Admin       | Owner / management. Created by an admin only  | `admin.dashboard.index` |

## Order statuses

| Code               | UI label                | Plain English                       |
| ------------------ | ----------------------- | ----------------------------------- |
| `pickup_scheduled` | Penjemputan Dijadwalkan | Pickup booked                       |
| `in_pickup`        | Dalam Penjemputan       | Being collected                     |
| `in_inspection`    | Dalam Inspeksi          | Awaiting/undergoing inspection      |
| `awaiting_payment` | Menunggu Pelunasan      | Quoted, unpaid                      |
| `in_cleaning`      | Dalam Pencucian         | Being washed                        |
| `in_delivery`      | Dalam Pengantaran       | Out for delivery                    |
| `completed`        | Selesai                 | Done                                |
| `cancelled`        | Dibatalkan              | Cancelled                           |

## Order types

| Code      | UI label | Meaning                                              |
| --------- | -------- | ---------------------------------------------------- |
| `online`  | Online   | Booked in the app by a registered customer           |
| `offline` | Offline  | Walk-in, recorded at the counter, no account         |

## Transaction statuses

| Code        | UI label   |
| ----------- | ---------- |
| `pending`   | Tertunda   |
| `paid`      | Terbayar   |
| `expired`   | Kedaluarsa |
| `cancelled` | Dibatalkan |
| `failed`    | Gagal      |

## Payment methods

| Code    | UI label |
| ------- | -------- |
| `cash`  | Tunai    |
| `qris`  | QRIS     |
| `debit` | Debit    |

## Service categories & types

| Category code  | UI label        |
| -------------- | --------------- |
| `shoe_wash`    | Cuci Sepatu     |
| `bag_wash`     | Cuci Tas        |
| `helmet_wash`  | Cuci Helm       |
| `shoe_repair`  | Reparasi Sepatu |
| `additional`   | Tambahan        |

| Type code     | UI label   | Meaning                                                       |
| ------------- | ---------- | ------------------------------------------------------------- |
| `regular`     | Harga      | Fixed price                                                   |
| `start_from`  | Mulai dari | Price depends on damage; the page prints "mulai" before it    |
| `additional`  | Tambahan   | Add-on, chosen alongside a main service                       |

| Item type | UI label |
| --------- | -------- |
| `shoe`    | Sepatu   |
| `bag`     | Tas      |
| `helmet`  | Helmet   |

The item type is **not** picked by staff — it is derived from the chosen
service's category by `itemTypeByCategory` in
[`inertia/components/organisms/item_fields.tsx`](../inertia/components/organisms/item_fields.tsx).

## Order actions

See the full table in [order-lifecycle.md §4](order-lifecycle.md#4-the-action-log).

---

## Common Indonesian words in the codebase and UI

| Indonesian        | English                        |
| ----------------- | ------------------------------ |
| Pesanan           | Order                          |
| Penjemputan       | Pickup / collection            |
| Pengantaran       | Delivery                       |
| Inspeksi          | Inspection                     |
| Pencucian         | Cleaning / washing             |
| Pelunasan         | Settlement (of payment)        |
| Pembayaran        | Payment                        |
| Layanan           | Service (catalogue entry)      |
| Pengguna          | User / account                 |
| Petugas           | Staff member                   |
| Pelanggan         | Customer                       |
| Alamat            | Address                        |
| Tugas             | Task                           |
| Struk             | Receipt                        |
| Laporan           | Report                         |
| Rekonsiliasi      | Reconciliation                 |
| Dasbor            | Dashboard                      |
| Ringkasan         | Summary                        |
| Kapasitas / Beban | Capacity / load                |
| Tanggal           | Date                           |
| Nomor             | Number                         |
| Tunai             | Cash                           |
| Kata sandi        | Password                       |
| Nomor telepon     | Phone number                   |

---

## Business constants, and where they live

| Constant                  | Value                          | File                                                        |
| ------------------------- | ------------------------------ | ----------------------------------------------------------- |
| `DAILY_PICKUP_LIMIT`      | 10 pickups/day                 | [`order_service.ts`](../app/services/order_service.ts)      |
| `ORDER_NUMBER_ATTEMPTS`   | 3 retries                      | [`order_service.ts`](../app/services/order_service.ts)      |
| Service centre coordinates| `-6.9555305, 107.6540353`      | [`address_service.ts`](../app/services/address_service.ts) and [`trip_controller.ts`](../app/controllers/staff/trip_controller.ts) — **duplicated** |
| `DIRECTIONAL_LIMITS_KM`   | N 30, S 10, E 30, W 20         | [`address_service.ts`](../app/services/address_service.ts)  |
| `PHOTO_RETENTION`         | `'90d'`                        | [`task_service.ts`](../app/services/task_service.ts)        |
| `REVENUE_TREND_DAYS`      | 14                             | [`dashboard_service.ts`](../app/services/dashboard_service.ts) |
| `PICKUP_FORECAST_DAYS`    | 7                              | [`dashboard_service.ts`](../app/services/dashboard_service.ts) |
| `DEFAULT_RANGE_DAYS`      | 30                             | [`report_service.ts`](../app/services/report_service.ts)    |
| `TOP_SERVICE_LIMIT`       | 5                              | [`report_service.ts`](../app/services/report_service.ts)    |
| `EXPORT_ROW_LIMIT`        | 5000                           | [`excel_service.ts`](../app/services/excel_service.ts)      |
| Page size (all lists)     | 10                             | each service's `.paginate(filters.page, 10)`                |

⚠️ The shop coordinates appear in **two** files. Move a shop and you must change
both, or staff routes will be measured from the old location while the service
area is checked against the new one.

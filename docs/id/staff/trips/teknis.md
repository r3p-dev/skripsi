# Perjalanan — Teknis

## Route

| Method | URL                               | Controller           | Nama route           |
| ------ | --------------------------------- | -------------------- | -------------------- |
| GET    | `/staff/tasks/:number/trip/:type` | `staff.Trip.show`    | `staff.trip.show`    |
| POST   | `/staff/tasks/:number/trip/:type` | `staff.Trip.update`  | `staff.trip.update`  |
| DELETE | `/staff/tasks/:number/trip/:type` | `staff.Trip.destroy` | `staff.trip.destroy` |

`:type` divalidasi oleh `#taskType`:

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

`TRIP_TYPES = [PICKUP, DELIVERY]`, dipersempit oleh type guard `isTripType`.

## Berkas

| Bagian      | Path                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------ |
| Controller  | [app/controllers/staff/trip_controller.ts](../../../../app/controllers/staff/trip_controller.ts) |
| Service     | [app/services/task_service.ts](../../../../app/services/task_service.ts)                         |
| Perutean    | [app/services/routing_service.ts](../../../../app/services/routing_service.ts)                   |
| Validator   | `taskPhotoValidator` di [task_validator.ts](../../../../app/validators/task_validator.ts)        |
| Transformer | [route_item_transformer.ts](../../../../app/transformers/route_item_transformer.ts)              |

## Perilaku digerakkan jenis

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

Dua tabel pencarian inilah seluruh perbedaan antara kedua jenis perjalanan.

## Antreannya

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
  return plan.stops.map(({ stop, distance }) => ({ ... , distanceMetres: distance }))
}
```

`RouteItem` membawa `id`, `orderNumber`, `type` (diturunkan dari status),
`pickupDate`, `distanceMetres`.

Depot: `getOperationalAreaCentroid()` (`ST_Centroid(ST_Collect(geometry))`),
jatuh ke pemberhentian pertama bila tidak ada.

## Layanan perutean

Dikonfigurasi lewat env: `OSRM_ENABLED`, `OSRM_URL`, `OSRM_PROFILE` (bawaan
`driving`), `OSRM_TIMEOUT_MS` (bawaan `5000`), `OSRM_MAX_TABLE_SIZE` (bawaan
`100`).

```ts
get isEnabled() { return ENABLED && !!BASE_URL }
```

`plan()` mengurutkan pemberhentian secara tetangga-terdekat dari depot. `line()`
mengembalikan `RouteLine` beserta `geometry` untuk peta.

Setiap hasil membawa `source: 'osrm' | 'haversine'`. Cadangannya memakai:

```ts
const ROAD_WINDING_FACTOR = 1.3
const AVERAGE_SPEED_MS = 8.3
const EARTH_RADIUS = 6371000
```

sehingga jarak haversine × 1,3 mendekati jarak jalan, dan durasi diturunkan dari
kecepatan rata-rata. **Penurunan kualitas sengaja dibuat senyap** — tabnya tetap
berfungsi saat OSRM mati.

## Menyelesaikan perjalanan

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

Urutan operasinya penting:

1. `#assertHolder` — melempar bila petugas lain memegang klaimnya.
2. **Foto disimpan sebelum transaksi dibuka.** Rollback karenanya meninggalkan
   berkas yatim di `order-actions/`.
3. Perubahan status, pencatatan aksi, dan pembersihan klaim adalah satu unit
   atomik.

`#storePhoto` menulis ke `order-actions/{uuid}.{ext}` lewat `photo.moveToDisk`.

## Validasi foto

```ts
export const taskPhotoValidator = vine.create({ photo: image() })

// shared.ts
export const image = () => vine.file({ size: '5mb', extnames: ['png', 'jpg', 'jpeg'] })
```

## Catatan aksi

`order_actions`
([migrasi](../../../../database/migrations/1786400000000_create_order_actions_table.ts)):

| Kolom        | Catatan                                     |
| ------------ | ------------------------------------------- |
| `order_id`   | FK → orders, `ON DELETE CASCADE`, terindeks |
| `user_id`    | FK → users, `ON DELETE SET NULL`, nullable  |
| `name`       | `ActionName`, terindeks                     |
| `photo_path` | nullable                                    |
| `note`       | nullable                                    |

Indeks komposit `['order_id', 'name']`. Foto disajikan lewat
`GET /internal/actions/:id/photo`, dibatasi untuk petugas dan admin.

## Kasus tepi

- **Pesanan tanpa `address_id` tidak pernah muncul** — `whereNotNull('address_id')`.
- **Pengantaran langsung ke `completed`**, melewati `cleaning_done`.
- **`:type` tidak valid adalah galat validasi**, bukan 404.
- **Jendela foto-yatim** yang dijelaskan di atas memang tidak dijaga.
- `Trip.destroy` memanggil `release`, yang tanpa efek secara diam bila pemanggil
  tidak memegang klaim.
- `plan()` menghormati `OSRM_MAX_TABLE_SIZE`; melewati batas itu permintaan
  matriks tidak dicoba.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)

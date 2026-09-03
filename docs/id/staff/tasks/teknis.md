# Tugas — Teknis

## Route

| Method | URL                               | Controller                 | Nama route                 |
| ------ | --------------------------------- | -------------------------- | -------------------------- |
| GET    | `/staff/tasks`                    | `staff.Trip.index`         | `staff.trip.index`         |
| GET    | `/staff/tasks/:number/trip/:type` | `staff.Trip.show`          | `staff.trip.show`          |
| POST   | `/staff/tasks/:number/trip/:type` | `staff.Trip.update`        | `staff.trip.update`        |
| DELETE | `/staff/tasks/:number/trip/:type` | `staff.Trip.destroy`       | `staff.trip.destroy`       |
| GET    | `/staff/tasks/:number/inspection` | `staff.Inspection.show`    | `staff.inspection.show`    |
| POST   | `/staff/tasks/:number/inspection` | `staff.Inspection.update`  | `staff.inspection.update`  |
| DELETE | `/staff/tasks/:number/inspection` | `staff.Inspection.destroy` | `staff.inspection.destroy` |
| POST   | `/staff/tasks/:number/cleaning`   | `staff.Cleaning.update`    | `staff.cleaning.update`    |
| POST   | `/staff/tasks/:number/collection` | `staff.Collection.update`  | `staff.collection.update`  |
| GET    | `/staff/tasks/:number/tag`        | `staff.Tag.show`           | `staff.tag.show`           |

## Berkas

| Bagian     | Path                                                                                 |
| ---------- | ------------------------------------------------------------------------------------ |
| Service    | [app/services/task_service.ts](../../../../app/services/task_service.ts)             |
| Controller | [app/controllers/staff/](../../../../app/controllers/staff/)                         |
| Enum tugas | [app/enums/task_enum.ts](../../../../app/enums/task_enum.ts)                         |
| Perutean   | [app/services/routing_service.ts](../../../../app/services/routing_service.ts)       |
| Halaman    | [inertia/pages/staff/trip/index.tsx](../../../../inertia/pages/staff/trip/index.tsx) |

## Antrean diturunkan, bukan disimpan

**Tidak ada tabel tasks**. Jenis tugas dipetakan ke status pesanan:

```ts
export const TASK_SOURCE_STATUS: Record<TaskType, OrderStatus> = {
  [TaskType.PICKUP]: OrderStatus.PICKUP_SCHEDULED,
  [TaskType.INSPECTION]: OrderStatus.IN_PICKUP,
  [TaskType.CLEANING]: OrderStatus.IN_CLEANING,
  [TaskType.DELIVERY]: OrderStatus.IN_DELIVERY,
  [TaskType.COLLECTION]: OrderStatus.CLEANING_DONE,
}
```

Perubahan status _adalah_ perpindahan tugas antar antrean. Tidak ada yang bisa
kehilangan sinkronisasi.

`TripController.index` memuat keempatnya secara paralel:

```ts
const [trips, inspections, cleanings, collections] = await Promise.all([
  this.taskService.getTripQueue(user),
  this.taskService.getInspectionQueue(user),
  this.taskService.getCleaningQueue(),
  this.taskService.getCollectionQueue(),
])
```

Perhatikan dua yang pertama menerima `user` (disaring klaim), dua terakhir tidak.

## Visibilitas klaim

```ts
#claimableQuery(user) {
  return Order.query().where((query) => {
    query
      .whereNull('claimed_by')
      .orWhere('claimed_by', user.id)
      .orWhere('claimed_at', '<', this.#claimFloor().toJSDate())
  })
}

#claimFloor() { return DateTime.now().minus({ hours: CLAIM_DURATION_HOURS }) }  // 3
```

Jadi petugas melihat tugas yang belum diklaim, miliknya sendiri, dan apa pun yang
klaimnya sudah basi.

## Memenangkan klaim

```ts
async claim(user, order, task) {
  if (!CLAIMABLE_TASKS.includes(task)) return true
  if (order.status !== TASK_SOURCE_STATUS[task]) return false

  const claimed = await db.from('orders')
    .where('id', order.id)
    .where('status', TASK_SOURCE_STATUS[task])
    .where((query) => {
      query.whereNull('claimed_by')
        .orWhere('claimed_by', user.id)
        .orWhere('claimed_at', '<', this.#claimFloor().toJSDate())
    })
    .update({ claimed_by: user.id, claimed_task: task, claimed_at: now }, ['id'])

  if (claimed.length === 0) return false
  await order.refresh()
  return true
}
```

**Inilah jaminan konkurensinya.** Syaratnya berada di `WHERE` milik `UPDATE`,
sehingga basis data yang memutuskan pemenangnya secara atomik. `RETURNING id`
memberi larik kosong kepada yang kalah. Tidak ada jendela baca-lalu-tulis.

`CLAIMABLE_TASKS = [PICKUP, DELIVERY, INSPECTION]` — cuci dan serah terima
langsung mengembalikan `true` tanpa menyentuh barisnya.

## Pemblokiran dan pelepasan

```ts
isBlocked(user, order) {
  if (order.claimedBy === null || order.claimedBy === user.id) return false
  return !!order.claimedAt && order.claimedAt > this.#claimFloor()
}

async release(user, order) {
  if (order.claimedBy !== user.id) return   // tanpa efek, diam-diam
  await this.#clearClaim(order)
}
```

`#assertHolder` melempar `E_VALIDATION_ERROR` pada `form` ketika bukan pemegang
klaim mencoba menyelesaikan tugas. Handler penyelesaian memanggil `#clearClaim`
di dalam transaksi yang sama dengan perubahan status.

## Klaim-saat-GET

Baik `Trip.show` maupun `Inspection.show` mengklaim sebelum merender:

```ts
const summary = await this.taskService.findSummaryByNumber(params.number)
const claimed = await this.taskService.claim(user, summary, type)

if (!claimed) {
  return inertia.render('...', { order: ..., blocked: true, route: null })
}
const order = await this.taskService.findByNumber(params.number)
```

Dua pilihan yang disengaja:

- **Sebuah `GET` melakukan mutasi.** Membuka halaman adalah klaimnya.
- **Tugas terblokir tetap dirender normal** dengan `blocked: true`, bukan 403.
  Petugas melihat konteks tanpa aksi.

`findSummaryByNumber` adalah pencarian polos; `findByNumber` yang mem-preload
penuh (address, items→orderItems, actions→staff) hanya berjalan setelah klaim
berhasil — menghindari kueri mahal bagi yang kalah.

## Pengurutan perjalanan

`getTripQueue` menarik pesanan yang bisa diklaim dengan status
`pickup_scheduled` atau `in_delivery` yang punya alamat, mem-preload `address`,
lalu menyerahkan pemberhentiannya ke `RoutingService.plan` yang dimulai dari
depot (`getOperationalAreaCentroid()`, jatuh ke pemberhentian pertama bila tidak
ada). Hasilnya membawa `distanceMetres`.

## Model data

Kolom klaim berada di `orders`
([migrasi](../../../../database/migrations/1781150470631_create_orders_table.ts)):

| Kolom          | Catatan                                     |
| -------------- | ------------------------------------------- |
| `claimed_by`   | FK → users, `ON DELETE SET NULL`, terindeks |
| `claimed_task` | string, berisi `TaskType`                   |
| `claimed_at`   | timestamp                                   |

Indeks komposit `['claimed_by', 'claimed_at']`.

## Kasus tepi

- **Klaim tidak pernah disapu.** Kedaluwarsa dievaluasi saat pembacaan terhadap
  `#claimFloor()`; baris basi mempertahankan nilainya sampai diklaim ulang.
- **`claimed_task` bersifat informatif.** Kelayakan ditentukan oleh `status`,
  bukan kolom ini.
- **`release` pada tugas yang tidak Anda pegang bersifat diam**, bukan galat.
- **Menghapus pengguna petugas membuat `claimed_by` menjadi null**
  (`ON DELETE SET NULL`), yang membebaskan tugasnya.
- **Menelusuri berarti mengklaim.** Membuka beberapa halaman tugas mengklaim
  masing-masing selama tiga jam kecuali dilepas.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)

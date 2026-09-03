# Pencucian & Serah Terima — Teknis

## Route

| Method | URL                               | Controller                | Nama route                |
| ------ | --------------------------------- | ------------------------- | ------------------------- |
| POST   | `/staff/tasks/:number/cleaning`   | `staff.Cleaning.update`   | `staff.cleaning.update`   |
| POST   | `/staff/tasks/:number/collection` | `staff.Collection.update` | `staff.collection.update` |
| GET    | `/staff/tasks/:number/tag`        | `staff.Tag.show`          | `staff.tag.show`          |

Pesan siap-ambil tidak punya route: ia dikirim oleh perintah harian
`send:daily-notices`, bukan oleh tindakan petugas.

Status sumber:

```ts
TASK_SOURCE_STATUS[CLEANING] = OrderStatus.IN_CLEANING
TASK_SOURCE_STATUS[COLLECTION] = OrderStatus.CLEANING_DONE
```

Keduanya tidak ada di `CLAIMABLE_TASKS = [PICKUP, DELIVERY, INSPECTION]`,
sehingga `claim()` langsung mengembalikan `true` tanpa menyentuh barisnya.

## Berkas

| Bagian        | Path                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| Controller    | `cleaning_`, `collection_`, `tag_controller.ts` di [app/controllers/staff/](../../../../app/controllers/staff/) |
| Service       | [app/services/task_service.ts](../../../../app/services/task_service.ts)                                        |
| Pemberitahuan | [app/services/notice_service.ts](../../../../app/services/notice_service.ts), `commands/send_daily_notices.ts`  |
| WhatsApp      | [app/notifications/whatsapp_service.ts](../../../../app/notifications/whatsapp_service.ts)                      |

## Pencucian

```ts
async completeCleaning(user, order, photo) {
  const [next] = this.orderService.nextStatuses(order)

  if (!next) {
    throw new vineErrors.E_VALIDATION_ERROR([
      { field: 'form', message: 'Pesanan ini tidak sedang dalam pencucian.' },
    ])
  }

  const photoPath = await this.#storePhoto(photo)

  return db.transaction(async (trx) => {
    await this.orderService.transitionTo(order, next, trx)
    await this.#recordAction(order, user, ActionName.CLEANING_DONE, trx, photoPath)
    return order
  })
}
```

Tujuannya **tidak ditulis mati** — melainkan berasal dari `nextStatuses`, yang
menciutkan dua pilihan `in_cleaning`:

```ts
nextStatuses(order) {
  if (order.status !== OrderStatus.IN_CLEANING) return ORDER_TRANSITIONS[order.status]
  return this.isDeliverable(order) ? [IN_DELIVERY] : [CLEANING_DONE]
}

isDeliverable(order) {
  return DELIVERABLE_TYPES.includes(order.type) && order.addressId !== null
}
// DELIVERABLE_TYPES = [ONLINE, WALK_IN_DELIVERY]
```

Perhatikan `completeCleaning` **tidak** memanggil `#assertHolder` atau
`#clearClaim` — pencucian adalah pekerjaan tanpa klaim.

Controller memilih pesan flash-nya lewat `awaitsDelivery(updated)`
(`status === IN_DELIVERY`).

## Serah terima

```ts
async completeCollection(user, order) {
  return db.transaction(async (trx) => {
    await this.orderService.transitionTo(order, OrderStatus.COMPLETED, trx)
    await this.#recordAction(order, user, ActionName.COLLECTED, trx)
    return order
  })
}
```

Jalur penyelesaian paling ringan: tanpa foto, tanpa validator, tanpa pemeriksaan
klaim. Keamanannya berasal dari `transitionTo`, yang menolak apa pun yang tidak
ada di `ORDER_TRANSITIONS[cleaning_done] = [completed]`.

## Pemberitahuan siap-ambil

Tidak ada tombol untuk ini. `node ace send:daily-notices` berjalan sekali sehari
dari penjadwal host dan mengabari setiap pesanan yang sedang menunggu.

```ts
async sendReadyForCollectionNotices(): Promise<NoticeResult> {
  return this.#deliver({
    action: ActionName.READY_NOTICE_SENT,
    status: OrderStatus.CLEANING_DONE,
    eligible: () => this.#unnotified(OrderStatus.CLEANING_DONE, ActionName.READY_NOTICE_SENT),
    send: (order) =>
      this.whatsappService.sendReadyForCollection(order.customerPhone, order.orderNumber),
  })
}
```

Syarat kelayakannya adalah `status = cleaning_done` tanpa aksi
`ready_notice_sent` — dilayani indeks komposit `['order_id', 'name']` pada
`order_actions`. Jalannya perintah yang sama juga menagih tagihan yang belum
dibayar — keduanya ada di
[app/services/notice_service.ts](../../../../app/services/notice_service.ts).

**Status dibaca ulang tepat sebelum pengiriman.** Daftarnya dikueri sekali di
awal, jadi pesanan yang keburu diambil atau dibatalkan dilewati, bukan dikirimi
pesan.

**Ini tidak transaksional.** Pengiriman WhatsApp terjadi lebih dulu; bila
pencatatan aksinya kemudian gagal, pesanan itu tetap perlu dikabari dan diambil
oleh jalannya perintah esok hari. Dapat diterima mengingat rendahnya risiko
pesan ganda.

### Penanganan kegagalan

Nomor yang tidak dapat dihubungi dicatat di log dan dihitung, lalu ronde
berlanjut ke pesanan berikutnya. Tidak ada aksi yang dicatat untuknya, sehingga
esok harinya dicoba lagi. Perintahnya keluar dengan kode `1` bila ada yang
gagal — itulah yang dipantau penjadwal.

## Label

`Tag.show` memanggil `findByNumber` (di-preload penuh: address,
items→orderItems, actions→staff) dan merender `staff/order/tag`. **Tanpa penjaga
status dan tanpa klaim** — label bisa dicetak pada tahap mana pun.

## Antrean

```ts
getCleaningQueue() // status = in_cleaning,   preload items + actions, terlama dulu
getCollectionQueue() // status = cleaning_done, preload items + actions, terlama dulu
```

Keduanya tidak memakai `#claimableQuery`, jadi setiap petugas melihat daftar yang
sama. Keduanya mem-preload `items` dan `actions`, dan dirender dengan varian
transformer `toDetail`.

## Kasus tepi

- **`completeCleaning` membaca `nextStatuses` sebelum menyimpan foto**, sehingga
  pesanan berstatus keliru gagal tanpa berkas yatim — berbeda dari perjalanan dan
  inspeksi.
- **Pesanan tanpa `next`** (sudah selesai atau dibatalkan) memberi pesan validasi
  yang jelas alih-alih crash.
- **Pesanan konter `WALK_IN_DELIVERY` bisa diantar**; yang murni `OFFLINE` tidak,
  bahkan bila entah bagaimana punya alamat.
- **Pemeriksaan pemberitahuan bersifat per pesanan, bukan per penerima** —
  mengganti telepon pelanggan tidak mengaktifkannya kembali.
- **Serah terima tidak punya bukti foto.** Aksi `collected` hanya mencatat siapa
  dan kapan.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)

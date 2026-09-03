# Inspeksi — Teknis

## Route

| Method | URL                               | Controller                 | Nama route                 |
| ------ | --------------------------------- | -------------------------- | -------------------------- |
| GET    | `/staff/tasks/:number/inspection` | `staff.Inspection.show`    | `staff.inspection.show`    |
| POST   | `/staff/tasks/:number/inspection` | `staff.Inspection.update`  | `staff.inspection.update`  |
| DELETE | `/staff/tasks/:number/inspection` | `staff.Inspection.destroy` | `staff.inspection.destroy` |

Status sumber: `TASK_SOURCE_STATUS[INSPECTION] = OrderStatus.IN_PICKUP`.

## Berkas

| Bagian          | Path                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| Controller      | [app/controllers/staff/inspection_controller.ts](../../../../app/controllers/staff/inspection_controller.ts) |
| Service tugas   | [app/services/task_service.ts](../../../../app/services/task_service.ts)                                     |
| Service katalog | [app/services/catalogue_service.ts](../../../../app/services/catalogue_service.ts)                           |
| Validator       | `inspectionValidator` di [task_validator.ts](../../../../app/validators/task_validator.ts)                   |

## Validator

```ts
export const inspectedItem = vine.object({
  type: vine.enum(ItemType),
  brand: string.trim().maxLength(50),
  model: string.trim().maxLength(50),
  size: string.trim().maxLength(20),
  material: string.trim().maxLength(50),
  condition: string.trim().maxLength(255),
  note: note(),
  catalogue: vine.number().positive(),
  additionalCatalogues: vine.array(vine.number().positive()).optional(),
})

export const inspectionValidator = vine.create({
  photo: image(),
  items: vine.array(inspectedItem).minLength(1).maxLength(MAX_ITEMS_PER_ORDER), // 10
})
```

`inspectedItem` dipakai bersama `offlineOrderValidator` dan
`orderItemsValidator` — bentuk yang sama menggerakkan inspeksi, pesanan konter,
dan koreksi barang.

## Kelayakan katalog

```ts
ItemTypeCategories: Record<ItemType, CatalogueCategory[]> = {
  shoe:   [SHOE_WASH, SHOE_REPAIR],
  bag:    [BAG_WASH],
  helmet: [HELMET_WASH],
}

#isCatalogueFor(catalogue, type) {
  return catalogue.type !== CatalogueType.ADDITIONAL
      && ItemTypeCategories[type].includes(catalogue.category)
}
```

Tambahan memakai `#isAdditionalCatalogueFor`, yang menerima apa pun bertipe
`CatalogueType.ADDITIONAL` tanpa memandang jenis barang — enum-nya menuliskan ini
secara eksplisit: pelapis atau biaya kilat berlaku untuk sepatu maupun tas.

### `resolveForSelections`

Satu kueri untuk semua id katalog yang dirujuk, lalu validasi per pilihan:

```ts
const ids = [...new Set(selections.flatMap((s) => [s.catalogue, ...(s.additionalCatalogues ?? [])]))]
const catalogues = await Catalogue.query(...).whereIn('id', ids)
const byId = new Map(catalogues.map((c) => [c.id, c]))
```

Galat dilempar pada jalur yang presisi sehingga UI bisa menyorot baris yang
bermasalah:

- `items.{index}.catalogue`
- `items.{index}.additionalCatalogues.{additionalIndex}`

Mengembalikan `Map<id, Catalogue>` untuk dipakai pemanggil menghitung harga —
resolusi terjadi sekali, sebelum transaksi.

## Menuntaskan inspeksi

```ts
async completeInspection(user, order, data) {
  this.#assertHolder(user, order)
  const catalogues = await this.catalogueService.resolveForSelections(data.items)
  const photoPath = await this.#storePhoto(data.photo)

  return db.transaction(async (trx) => {
    await Item.query({ client: trx }).where('order_id', order.id).delete()

    let total = 0
    for (const entry of data.items) {
      total += await this.#recordInspectedItem(order, entry, catalogues, trx)
    }

    order.merge({ totalPrice: total.toString() })
    order.useTransaction(trx)
    await order.save()

    await this.orderService.transitionTo(order, OrderStatus.AWAITING_PAYMENT, trx)
    await this.#recordAction(order, user, ActionName.INSPECTION, trx, photoPath)
    await this.#clearClaim(order, trx)
    return order
  })
}
```

Perhatikan pola **hapus-lalu-buat-ulang**: `Item.query().where('order_id').delete()`
menghapus barang yang dideklarasikan pelanggan. `order_items` ikut terhapus dari
`items` (`ON DELETE CASCADE`), jadi baris layanannya ikut hilang.

Resolusi katalog dan penyimpanan foto terjadi **sebelum** transaksi dibuka —
sehingga kegagalan validasi tidak memakan kerja basis data, tetapi rollback
meninggalkan foto yatim.

## Mencatat satu barang

```ts
async #recordInspectedItem(order, entry, catalogues, trx) {
  const item = await Item.create({ orderId: order.id, ...entry }, { client: trx })

  const chosen = [entry.catalogue, ...(entry.additionalCatalogues ?? [])]
  const lines = chosen.map((catalogueId) => {
    const catalogue = catalogues.get(catalogueId)!
    return {
      orderId: order.id, itemId: item.id, catalogueId: catalogue.id,
      name: catalogue.name, condition: entry.condition,
      price: catalogue.price, subtotal: Number(catalogue.price).toString(),
    }
  })

  await OrderItem.createMany(lines, { client: trx })
  return lines.reduce((total, line) => total + Number(line.subtotal), 0)
}
```

`OrderItem.createMany` menggabungkan baris layanan menjadi satu penyisipan.
Barangnya sendiri tetap butuh penyisipan tersendiri lebih dulu, karena barisnya
memerlukan `item.id`.

**`name` dan `price` disalin ke barisnya**, bukan di-join. Perubahan harga
katalog di kemudian hari tidak menulis ulang pesanan lama.

## Model data

`order_items`
([migrasi](../../../../database/migrations/1781150474789_create_order_items_table.ts)):

| Kolom                       | Catatan                       |
| --------------------------- | ----------------------------- |
| `order_id`                  | FK → orders, CASCADE          |
| `catalogue_id`              | FK → catalogues, **RESTRICT** |
| `item_id`                   | FK → items, CASCADE           |
| `name`, `price`, `subtotal` | salinan denormalisasi         |
| `condition`                 | disalin dari barangnya        |

`RESTRICT` pada `catalogue_id` inilah sebabnya katalog yang sedang dipakai tidak
bisa dihapus — lihat [admin/catalogue](../../admin/catalogue/).

## Render saat terblokir

`Inspection.show` mengklaim lebih dulu, dan bila gagal merender dengan
`blocked: true` serta larik katalog kosong — `getPublicCatalogues()` yang mahal
dilewati untuk petugas yang tidak bisa bertindak.

## Kasus tepi

- **Barang pelanggan dimusnahkan**, bersama inspeksi sebelumnya bila ada.
- **Penetapan harga ulang selalu total**, tidak pernah bertahap.
- **`condition` disimpan di setiap baris `order_item`** untuk barang tersebut,
  menduplikasinya per layanan.
- **Jendela foto-sebelum-transaksi** bisa membuat berkas yatim.
- `#recordInspectedItem` memakai non-null assertion pada `catalogues.get(...)`,
  yang aman hanya karena `resolveForSelections` sudah memvalidasi setiap id.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)

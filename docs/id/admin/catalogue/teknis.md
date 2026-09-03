# Katalog — Teknis

## Route

| Method | URL                          | Controller                | Nama route                |
| ------ | ---------------------------- | ------------------------- | ------------------------- |
| GET    | `/admin/catalogues`          | `admin.Catalogue.index`   | `admin.catalogue.index`   |
| GET    | `/admin/catalogues/create`   | `admin.Catalogue.create`  | `admin.catalogue.create`  |
| POST   | `/admin/catalogues`          | `admin.Catalogue.store`   | `admin.catalogue.store`   |
| GET    | `/admin/catalogues/:id/edit` | `admin.Catalogue.edit`    | `admin.catalogue.edit`    |
| PUT    | `/admin/catalogues/:id`      | `admin.Catalogue.update`  | `admin.catalogue.update`  |
| DELETE | `/admin/catalogues/:id`      | `admin.Catalogue.destroy` | `admin.catalogue.destroy` |

Dialamatkan lewat **id**, berbeda dari pesanan yang memakai `order_number`.

## Berkas

| Bagian     | Path                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| Controller | [app/controllers/admin/catalogue_controller.ts](../../../../app/controllers/admin/catalogue_controller.ts) |
| Service    | [app/services/catalogue_service.ts](../../../../app/services/catalogue_service.ts)                         |
| Validator  | [app/validators/catalogue_validator.ts](../../../../app/validators/catalogue_validator.ts)                 |
| Enum       | [app/enums/catalogue_enum.ts](../../../../app/enums/catalogue_enum.ts)                                     |

## Validator dan pemetaan nama

```ts
export const catalogueValidator = vine.create({
  catalogueName: vine.string().trim().minLength(3).maxLength(100),
  description: vine.string().trim().minLength(3).maxLength(255),
  price: price(), // number.positive().max(100_000_000)
  category: vine.enum(Object.values(CatalogueCategory)),
  type: vine.enum(Object.values(CatalogueType)),
})
```

Field form-nya `catalogueName` tetapi kolomnya `name`:

```ts
#toAttributes({ catalogueName, price, ...rest }: CatalogueData) {
  return { ...rest, name: catalogueName, price: price.toString() }
}
```

`price` juga dikonversi dari number ke string untuk kolom `decimal(8,2)`.

## Enum

```ts
CatalogueType = { REGULAR, START_FROM, ADDITIONAL }
CatalogueCategory = { SHOE_WASH, BAG_WASH, HELMET_WASH, SHOE_REPAIR, ADDITIONAL }
```

Perhatikan `ADDITIONAL` ada di **keduanya** — `type` menandai sebuah baris sebagai
layanan tambahan, sementara `category` mengelompokkannya. Kelayakan berpatokan
pada `type`:

```ts
#isCatalogueFor(catalogue, itemType) {
  return catalogue.type !== CatalogueType.ADDITIONAL
      && ItemTypeCategories[itemType].includes(catalogue.category)
}
```

`ItemTypeCategories` berada di
[item_enum.ts](../../../../app/enums/item_enum.ts).

## Pendaftaran

```ts
async list(filters: { search: string; page: number }) {
  const query = Catalogue.query().orderBy('created_at', 'desc')

  if (filters.search) {
    query.where((builder) => {
      builder
        .whereILike('name', `%${filters.search}%`)
        .orWhereILike('description', `%${filters.search}%`)
    })
  }

  return query.paginate(filters.page, 10)
}
```

Berbeda dari `orders` dan `users`, **`catalogues` tidak punya indeks trigram** —
pencarian `ILIKE '%term%'`-nya melakukan pemindaian sekuensial. Dapat diterima
karena tabelnya kecil dan dikelola admin.

## Deteksi sedang-terpakai

```ts
async inUseIds(catalogues: Catalogue[]): Promise<number[]> {
  const ids = catalogues.map((c) => c.id)
  if (ids.length === 0) return []

  const rows = await db.from('order_items').whereIn('catalogue_id', ids).distinct('catalogue_id')
  return rows.map((row) => Number(row.catalogue_id))
}
```

Satu kueri berkelompok untuk seluruh halaman — tanpa N+1. `index` mengirimkan
`inUseIds`, dan `edit` mengirimkan `isInUse` untuk satu baris.

## Penjaga penghapusan

```ts
async deleteCatalogue(id: number): Promise<void> {
  const catalogue = await Catalogue.findOrFail(id)
  const booked = await db.from('order_items')
    .where('catalogue_id', catalogue.id).count('* as total').first()

  if (Number(booked?.total ?? 0) > 0) {
    throw new errors.E_VALIDATION_ERROR([
      { field: 'form', message: 'Layanan ini sudah pernah dipesan dan tidak dapat dihapus.' },
    ])
  }

  await catalogue.delete()
}
```

Dua lapis: pemeriksaan di service memberi pesan yang terbaca, dan
`order_items.catalogue_id` bersifat `ON DELETE RESTRICT`, jadi melewati service
pun tetap gagal di basis data.

**Penyuntingan tidak diblokir** — hanya penghapusan. `isInUse` pada layar sunting
bersifat informatif.

## Pengambilan cuplikan harga

Saat inspeksi, `#recordInspectedItem` menyalin `catalogue.name` dan
`catalogue.price` ke tiap baris `order_item`. Karena itu pesanan lama kebal
terhadap penyuntingan katalog, dan itulah yang membuat penyuntingan harga secara
bebas menjadi aman.

## Model data

`catalogues`
([migrasi](../../../../database/migrations/1781150469524_create_catalogues_table.ts)):

| Kolom         | Catatan      |
| ------------- | ------------ |
| `name`        | string       |
| `price`       | decimal(8,2) |
| `description` | text         |
| `category`    | terindeks    |
| `type`        | terindeks    |

`price` bertipe `decimal(8,2)` — maksimal 999.999,99 — sementara validator
mengizinkan sampai 100.000.000. **Harga di atas jangkauan kolom akan gagal di
basis data, bukan di validasi.**

## Pengguna lainnya

- `getPublicCatalogues()` — layar inspeksi dan pesanan konter
- `getCatalogueOptions()` — dikelompokkan per jenis barang dengan `catalogues`
  dan `additionalCatalogues` untuk tiap jenis
- `resolveForSelections()` — memvalidasi id yang dipilih, lihat
  [staff/inspection](../../staff/inspection/teknis.md)

## Kasus tepi

- **`catalogueName` versus `name`** menjebak orang yang membaca validator
  berdampingan dengan skema.
- **Maksimum validator (100 juta) melampaui jangkauan kolom (999.999,99).**
- **Tidak ada penanda arsip** — layanan pensiun yang pernah terpakai tetap
  terdaftar selamanya.
- **Tidak ada indeks trigram** pada kolom pencarian tabel ini.
- **`ADDITIONAL` muncul di kedua enum** dengan makna berbeda.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)

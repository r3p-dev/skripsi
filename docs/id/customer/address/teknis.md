# Alamat — Teknis

## Route

| Method | URL                | Controller                | Nama route                 | Limiter          |
| ------ | ------------------ | ------------------------- | -------------------------- | ---------------- |
| GET    | `/address`         | `customer.Address.show`   | `customer.address.show`    | —                |
| GET    | `/address/create`  | `customer.Address.create` | `customer.address.create`  | —                |
| POST   | `/address`         | `customer.Address.store`  | `customer.address.store`   | —                |
| GET    | `/address/geocode` | `customer.Geocode.show`   | `customer.address.geocode` | `geocodeLimiter` |
| GET    | `/address/nearby`  | `customer.Geocode.nearby` | `customer.address.nearby`  | `geocodeLimiter` |

`geocodeLimiter`: 30 permintaan / 1 menit, blokir 1 menit, dikunci pada id
pengguna (jatuh ke IP bila tidak ada).

## Berkas

| Bagian          | Path                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Controller      | `address_controller.ts`, `geocode_controller.ts` di [app/controllers/customer/](../../../../app/controllers/customer/) |
| Service alamat  | [app/services/address_service.ts](../../../../app/services/address_service.ts)                                         |
| Geocoding       | [app/services/geocoding_service.ts](../../../../app/services/geocoding_service.ts)                                     |
| Tempat terdekat | [app/services/nearby_service.ts](../../../../app/services/nearby_service.ts)                                           |
| Validator       | [app/validators/address_validator.ts](../../../../app/validators/address_validator.ts)                                 |
| Model           | [app/models/address.ts](../../../../app/models/address.ts)                                                             |

## Validator

```ts
addressValidator = {
  name, // 1–50, alpha + spasi + tanda hubung
  phone, // aturan telepon ID
  street: string.trim().maxLength(255),
  latitude: number.min(-90).max(90),
  longitude: number.min(-180).max(180),
  note: string.trim().optional(),
}
```

Batas koordinat di sini hanya pemeriksaan kewajaran. Kendala sesungguhnya adalah
pemeriksaan PostGIS di dalam service.

## Model data

`addresses` ([migrasi](../../../../database/migrations/1781150468467_create_addresses_table.ts)):

| Kolom                    | Tipe          | Catatan                                     |
| ------------------------ | ------------- | ------------------------------------------- |
| `user_id`                | integer       | terindeks, FK → users, `ON DELETE RESTRICT` |
| `latitude` / `longitude` | decimal(10,7) |                                             |
| `is_active`              | boolean       | default `true`                              |

```sql
CREATE UNIQUE INDEX one_active_address_per_user
  ON addresses (user_id) WHERE is_active = true
```

Indeks parsial itulah jaminan sesungguhnya "satu alamat aktif" — logika service
dan skema saling sepakat.

`operational_areas` menyimpan poligon layanan sebagai kolom PostGIS sungguhan:

```sql
geometry geometry(Polygon, 4326) NOT NULL
CONSTRAINT operational_areas_geometry_valid CHECK (ST_IsValid(geometry))
CREATE INDEX operational_areas_geometry_index ON operational_areas USING GIST (geometry)
```

## Pemeriksaan area layanan

Satu titik, dipakai saat menyimpan:

```ts
async #isWithinOperationalArea(longitude, latitude) {
  const area = await OperationalArea.query()
    .where('is_active', true)
    .whereRaw('ST_Covers(geometry, ST_SetSRID(ST_MakePoint(?, ?), 4326))', [longitude, latitude])
    .select('id').first()
  return area !== null
}
```

Berkelompok, dipakai untuk menyaring hasil geocoder — **satu perjalanan untuk
seluruh himpunan**:

```sql
SELECT candidate.idx
  FROM (VALUES (?::int, ?::float8, ?::float8), ...) AS candidate (idx, longitude, latitude)
 WHERE EXISTS (
   SELECT 1 FROM operational_areas
    WHERE is_active = true
      AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(candidate.longitude, candidate.latitude), 4326))
 )
```

`filterWithinOperationalArea` sebelumnya menerbitkan satu kueri per kandidat;
bentuk daftar VALUES membuat PostGIS menjawab semuanya sekaligus terhadap indeks
GIST. Ini berada di jalur cari-sambil-mengetik, jadi selisihnya terasa per
ketukan tombol.

## Mengganti alamat

`replaceActiveAddress(user, data)`:

1. `#isWithinOperationalArea` — melempar `E_VALIDATION_ERROR` pada field
   **`radius`** jika di luar.
2. Di dalam satu transaksi:
   - `#removeCurrentAddress(user, trx)`
   - `Address.create({ ...data, userId, isActive: true })`

`#removeCurrentAddress` memutuskan hapus atau nonaktifkan:

```ts
if (await this.#isReferencedByOrder(currentAddress, trx)) {
  await currentAddress.merge({ isActive: false }).useTransaction(trx).save()
  return
}
await currentAddress.useTransaction(trx).delete()
```

FK-nya `ON DELETE RESTRICT`, jadi menghapus alamat yang dirujuk akan gagal di
basis data. Pemeriksaan ini mengubahnya menjadi penonaktifan yang mulus.

## Pembersihan

```ts
async deleteOrphanedAddresses(): Promise<number> {
  const deleted = await Address.query()
    .where('is_active', false)
    .whereDoesntHave('orders', (query) => query)
    .delete()
  return Number(deleted[0] ?? 0)
}
```

Satu penghapusan berbasis himpunan. Belum tersambung ke route atau penjadwal —
panggil dari command atau task runner bila ingin pembersihan berkala.

## Endpoint geocoding

`Geocode.show`:

1. `getOperationalAreaBounds()` — `ST_Extent` atas area aktif, dipakai untuk
   membiaskan pencarian.
2. `geocodingService.search(query, bounds)` → Nominatim.
3. `filterWithinOperationalArea(candidates)`.
4. Mengembalikan `{ results, reason }` dengan `reason` bernilai `null`,
   `'not_found'`, `'outside_area'`, atau `'unavailable'`.

Galat apa pun yang dilempar menjadi `503` dengan `reason: 'unavailable'`,
sehingga gangguan layanan hulu menurunkan kualitas alih-alih menggagalkan
halaman.

`Geocode.nearby` memakai Overpass lewat `NearbyService` — hasil diurutkan
berdasarkan jarak dan dibatasi 12, dengan cache dalam proses berisi 200 entri.

## Kasus tepi

- **Nama field `radius` keliru.** Pemeriksaannya adalah pencakupan poligon;
  tidak ada radius. Tampilan galat di frontend berpatokan pada field ini.
- **Bounds bisa `null`** ketika tidak ada area operasional aktif — pencarian lalu
  berjalan tanpa bias dan semua kandidat tersaring habis, menghasilkan
  `outside_area`.
- **`getOperationalAreaCentroid()`** (`ST_Centroid(ST_Collect(geometry))`) adalah
  cadangan depot untuk perencanaan rute, dan juga `null` bila tidak ada area.
- **`ON DELETE RESTRICT` pada `user_id`** berarti pelanggan yang punya alamat
  tidak bisa dihapus permanen tanpa menangani alamatnya lebih dulu.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)

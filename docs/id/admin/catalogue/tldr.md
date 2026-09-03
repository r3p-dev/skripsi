# Katalog — TL;DR

Layanan yang dijual toko beserta harganya. Inilah sumber harga bagi
[inspeksi](../../staff/inspection/).

![Daftar layanan dengan penanda sedang-terpakai](../../../assets/admin-catalogue-index-desktop.png)

## Lima hal yang perlu diketahui

1. **Entri katalog yang pernah dipesan tidak bisa dihapus.** FK `catalogue_id`
   pada `order_items` bersifat `RESTRICT`, dan service memeriksanya lebih dulu
   dengan pesan yang jelas.
2. **Harga disalin ke baris pesanan saat inspeksi.** Mengubah harga tidak pernah
   menulis ulang pesanan lama.
3. **Kategori menentukan jenis barang mana yang bisa memakainya.** `shoe_wash`
   dan `shoe_repair` untuk sepatu, `bag_wash` untuk tas, `helmet_wash` untuk
   helm.
4. **Tipe `additional` tidak terikat jenis barang** — pelapis atau biaya kilat
   berlaku untuk apa pun.
5. **Field form-nya `catalogueName`, kolomnya `name`** — dipetakan di
   `#toAttributes`.

## Route sekilas

| Method   | URL                                                    | Fungsi                             |
| -------- | ------------------------------------------------------ | ---------------------------------- |
| GET      | `/admin/catalogues`                                    | Daftar (paginasi 10)               |
| GET/POST | `/admin/catalogues/create` · `/admin/catalogues`       | Menambah                           |
| GET/PUT  | `/admin/catalogues/:id/edit` · `/admin/catalogues/:id` | Menyunting                         |
| DELETE   | `/admin/catalogues/:id`                                | Menghapus (diblokir bila terpakai) |

## Validator

```ts
catalogueValidator = {
  catalogueName: string.trim().minLength(3).maxLength(100),
  description: string.trim().minLength(3).maxLength(255),
  price: number.positive().max(100_000_000),
  category: vine.enum(CatalogueCategory),
  type: vine.enum(CatalogueType),
}
```

## Jebakannya

**Menyunting katalog yang terpakai diizinkan; menghapusnya tidak.** Jadi harga
bisa diubah bebas — ia hanya memengaruhi pesanan berikutnya — tetapi barisnya
harus tetap ada supaya struk masih bisa ditelusuri. Layar sunting menerima
`isInUse` supaya UI bisa memperingatkan.

→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
→ Detail implementasi: [teknis.md](teknis.md)

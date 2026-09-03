# Inspeksi — TL;DR

**Di sinilah sebuah pesanan mendapat harganya.** Petugas memeriksa barang yang
sudah dijemput, mencocokkan tiap barang dengan layanan katalog, dan totalnya
dihitung dari situ.

![Form inspeksi — barang, kondisi, layanan](../../../assets/staff-inspection-show-mobile.png)

## Lima hal yang perlu diketahui

1. **Harga tercipta di sini, tidak di tempat lain.** `totalPrice` berubah dari
   `null` menjadi angka sungguhan.
2. **Barang dihapus lalu dibuat ulang.** Inspeksi menghapus barang yang
   dideklarasikan pelanggan dan menulis apa yang benar-benar ditemukan petugas.
3. **Tiap barang mendapat satu layanan utama plus tambahan opsional.** Layanan
   utama harus cocok dengan jenis barang; tambahan harus bertipe `additional`.
4. **Foto wajib**, dengan aturan 5 MB JPG/PNG yang sama seperti perjalanan.
5. **Menuntaskannya memindahkan pesanan ke `awaiting_payment`** dan melepas
   klaim.

## Route sekilas

| Method | URL                               | Fungsi                     |
| ------ | --------------------------------- | -------------------------- |
| GET    | `/staff/tasks/:number/inspection` | Membuka — **mengklaimnya** |
| POST   | `/staff/tasks/:number/inspection` | Mengirim hasil inspeksi    |
| DELETE | `/staff/tasks/:number/inspection` | Mengembalikan ke antrean   |

## Pencocokan katalog

```ts
ItemTypeCategories = {
  shoe: [shoe_wash, shoe_repair],
  bag: [bag_wash],
  helmet: [helmet_wash],
}
```

Layanan utama sah bila tipenya **bukan** `additional` **dan** kategorinya ada di
daftar untuk jenis barang tersebut.

## Jebakannya

**Daftar barang dari pelanggan dibuang.** Apa yang mereka jelaskan saat memesan
digantikan sepenuhnya oleh apa yang dicatat petugas. Jika pelanggan bilang
"1 sepatu" tetapi mengirim tiga, inspeksilah kebenarannya dan harga mengikutinya.

Jebakan kedua: **inspeksi ulang menghitung harga dari nol.** Tidak ada
penyuntingan bertahap — totalnya dihitung ulang dari barang yang dikirim setiap
kali.

→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
→ Detail implementasi: [teknis.md](teknis.md)

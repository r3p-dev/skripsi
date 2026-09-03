# UmimaClean — Dokumentasi Bahasa Indonesia

UmimaClean adalah layanan cuci dan reparasi sepatu, tas, dan helm dengan
antar-jemput di area Bandung. Dibangun dengan AdonisJS 7 + Inertia + React 19 di
atas PostgreSQL + PostGIS.

## Cara dokumentasi ini disusun

Setiap domain punya **tiga berkas**, jadi Anda bisa memilih kedalaman yang
dibutuhkan:

| Berkas       | Untuk siapa              | Isinya                                                                    |
| ------------ | ------------------------ | ------------------------------------------------------------------------- |
| `tldr.md`    | Siapa pun yang buru-buru | Ringkasan domain di bawah satu menit — fakta kunci dan satu jebakan utama |
| `panduan.md` | Produk, QA, anggota baru | Penjelasan bahasa sehari-hari tentang apa yang dilakukan pengguna         |
| `teknis.md`  | Developer                | Route, berkas, model data, aturan bisnis, kasus tepi                      |

Versi bahasa Inggris ada di [`../en/`](../en/) dengan nama folder yang sama
(`tldr.md`, `guide.md`, `technical.md`).

## Role

| Role      | Enum       | Prefix URL | Diarahkan ke setelah login |
| --------- | ---------- | ---------- | -------------------------- |
| Pelanggan | `customer` | —          | `customer.profile.show`    |
| Petugas   | `staff`    | `/staff`   | `staff.profile.show`       |
| Admin     | `admin`    | `/admin`   | `admin.profile.show`       |

Definisi role ada di [app/enums/role_enum.ts](../../app/enums/role_enum.ts).
Satu akun punya tepat satu role; tidak ada pergantian role.

## Domain

### Pelanggan

| Domain                       | Cakupan                                                 |
| ---------------------------- | ------------------------------------------------------- |
| [auth](customer/auth/)       | Daftar, masuk, lupa kata sandi, keluar                  |
| [profile](customer/profile/) | Nama, ganti nomor telepon, ganti kata sandi             |
| [address](customer/address/) | Satu alamat tersimpan, pencarian peta, cek area layanan |
| [orders](customer/orders/)   | Membuat pesanan jemput, memantau, struk                 |
| [payment](customer/payment/) | Melunasi tagihan lewat QRIS setelah inspeksi            |

### Petugas

| Domain                                            | Cakupan                                       |
| ------------------------------------------------- | --------------------------------------------- |
| [profile](staff/profile/)                         | Data akun petugas sendiri                     |
| [tasks](staff/tasks/)                             | Antrean kerja terpadu dan sistem klaim        |
| [trips](staff/trips/)                             | Perjalanan jemput dan antar, perencanaan rute |
| [inspection](staff/inspection/)                   | Mencatat barang, menentukan harga             |
| [cleaning-collection](staff/cleaning-collection/) | Tandai selesai cuci, kabari, serah terima     |
| [counter-orders](staff/counter-orders/)           | Pesanan langsung di toko                      |

### Admin

| Domain                                  | Cakupan                                |
| --------------------------------------- | -------------------------------------- |
| [profile](admin/profile/)               | Data akun admin sendiri                |
| [dashboard](admin/dashboard/)           | Ikhtisar operasional langsung          |
| [orders](admin/orders/)                 | Seluruh pesanan, penyaringan, ekspor   |
| [reconciliation](admin/reconciliation/) | Konfirmasi pembayaran di luar aplikasi |
| [catalogue](admin/catalogue/)           | Layanan dan harga                      |
| [users](admin/users/)                   | Akun dan role                          |
| [reports](admin/reports/)               | Pendapatan per rentang tanggal, ekspor |

## Siklus pesanan dalam satu gambar

```
                  ┌──────────────────┐
  pesanan online →│ pickup_scheduled │ → cancelled
                  └────────┬─────────┘
                           ↓  petugas selesai menjemput
                    ┌─────────────┐
                    │  in_pickup  │
                    └──────┬──────┘
                           ↓  petugas membuka inspeksi
                   ┌───────────────┐
                   │ in_inspection │
                   └───────┬───────┘
                           ↓  petugas menentukan harga
                  ┌──────────────────┐
                  │ awaiting_payment │ ← admin rekonsiliasi / pelanggan bayar
                  └────────┬─────────┘
                           ↓
                    ┌─────────────┐
  pesanan konter → │ in_cleaning │
                    └──┬───────┬──┘
         ada alamat ↙            ↘ tanpa alamat
        ┌─────────────┐       ┌────────────────┐
        │ in_delivery │       │ cleaning_done  │
        └──────┬──────┘       └───────┬────────┘
               ↓                      ↓
            ┌───────────────────────────┐
            │        completed          │
            └───────────────────────────┘
```

Perpindahan yang diizinkan ditegakkan lewat `ORDER_TRANSITIONS` di
[app/services/order_service.ts](../../app/services/order_service.ts). Apa pun
yang tidak terdaftar di sana ditolak sebagai galat validasi.

## Stack

- **Backend**: AdonisJS 7, Lucid ORM, PostgreSQL + PostGIS
- **Frontend**: Inertia.js + React 19, Tailwind CSS, UI gaya shadcn, Leaflet
- **Realtime**: `@adonisjs/transmit` (SSE)
- **Notifikasi**: WhatsApp via Fonnte
- **Pembayaran**: Midtrans (QRIS) plus tunai/debit di konter
- **Geospasial**: Nominatim (geocoding), Overpass (tempat terdekat), PostGIS
  (validasi area layanan), OSRM mandiri (perencanaan rute)
- **Ekspor**: ExcelJS

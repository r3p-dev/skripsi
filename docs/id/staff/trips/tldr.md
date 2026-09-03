# Perjalanan — TL;DR

Rit penjemputan dan pengantaran. Keduanya adalah perjalanan ke alamat pelanggan,
jadi keduanya berbagi satu layar, satu perencana rute, dan satu alur
penyelesaian.

![Perjalanan jemput beserta peta rutenya](../../../assets/staff-trips-pickup-mobile.png)

## Lima hal yang perlu diketahui

1. **Jemput dan antar adalah jalur kode yang sama**, diparameterkan lewat
   `:type` (`pickup` \| `delivery`).
2. **Foto wajib untuk menyelesaikan perjalanan.** JPG/PNG, maksimal 5 MB.
3. **Menyelesaikan penjemputan** memindahkan pesanan ke `in_pickup` — pesanan
   masuk antrean inspeksi. **Menyelesaikan pengantaran** memindahkannya ke
   `completed`.
4. **Antrean diurutkan menurut rute, bukan waktu.** Pemberhentian diurutkan lewat
   rencana tetangga-terdekat dari depot.
5. **OSRM bersifat opsional.** Jika dimatikan atau tak terjangkau, jarak jatuh ke
   haversine × 1,3 dan rencananya tetap berjalan.

## Route sekilas

| Method | URL                               | Fungsi                                |
| ------ | --------------------------------- | ------------------------------------- |
| GET    | `/staff/tasks/:number/trip/:type` | Membuka perjalanan — **mengklaimnya** |
| POST   | `/staff/tasks/:number/trip/:type` | Menyelesaikannya (foto wajib)         |
| DELETE | `/staff/tasks/:number/trip/:type` | Mengembalikannya ke antrean           |

## Pemetaan status

```ts
COMPLETION_STATUS = { pickup: in_pickup, delivery: completed }
COMPLETION_ACTION = { pickup: ActionName.PICKUP, delivery: ActionName.DELIVERY }
```

## Jebakannya

**`:type` yang tidak dikenali adalah galat validasi, bukan 404.** `#taskType`
menjalankan `isTripType` dan melempar `E_VALIDATION_ERROR` pada field `type`,
sehingga hanya `pickup` dan `delivery` yang sampai ke handler.

Jebakan kedua: **foto diunggah sebelum transaksi dibuka.** Perpindahan status
yang gagal meninggalkan berkas yatim di disk.

→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
→ Detail implementasi: [teknis.md](teknis.md)

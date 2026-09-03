# Tugas — TL;DR

**Satu halaman menampung seluruh pekerjaan petugas**, dibagi menjadi empat tab.
Membuka sebuah tugas berarti **mengklaimnya**, sehingga dua orang tidak
mengerjakan pekerjaan yang sama.

![Antrean dengan empat tab beserta jumlahnya](../../../assets/staff-tasks-index-mobile.png)

## Lima hal yang perlu diketahui

1. **Antrean diturunkan dari status pesanan, bukan tabel tugas.** Tidak ada baris
   tugas — `TASK_SOURCE_STATUS` memetakan tiap jenis tugas ke status yang
   menghasilkannya.
2. **Klaim bersifat otomatis.** Membuka tugas berarti mengklaimnya. Tidak ada
   tombol "terima".
3. **Klaim kedaluwarsa setelah 3 jam** (`CLAIM_DURATION_HOURS`). Setelah itu
   siapa pun bisa mengambil alih.
4. **Hanya tiga jenis tugas yang bisa diklaim**: jemput, antar, inspeksi. Cuci
   dan serah terima adalah pekerjaan bersama.
5. **Klaim dimenangkan lewat `UPDATE` bersyarat**, bukan baca-lalu-tulis —
   sehingga dua petugas yang menekan bersamaan tidak bisa sama-sama menang.

## Empat tab

| Tab                         | Status sumber                     | Bisa diklaim |
| --------------------------- | --------------------------------- | ------------ |
| Perjalanan (jemput + antar) | `pickup_scheduled`, `in_delivery` | ya           |
| Inspeksi                    | `in_pickup`                       | ya           |
| Pencucian                   | `in_cleaning`                     | tidak        |
| Serah terima                | `cleaning_done`                   | tidak        |

## Route sekilas

| Method | URL                               | Fungsi                            |
| ------ | --------------------------------- | --------------------------------- |
| GET    | `/staff/tasks`                    | Antrean — empat tab sekaligus     |
| GET    | `/staff/tasks/:number/trip/:type` | Membuka perjalanan (mengklaimnya) |
| DELETE | `/staff/tasks/:number/trip/:type` | Mengembalikannya ke antrean       |

## Jebakannya

**Tugas yang terblokir tetap merender halaman** — ia hanya kembali dengan
`blocked: true` dan tanpa data rute. Petugas melihat pesanannya tetapi tidak bisa
bertindak. Jangan mengharapkan 403.

Jebakan kedua: **klaim adalah efek samping dari sebuah `GET`.** Membuka halaman
detail tugas mengubah basis data. Itu disengaja tetapi mengejutkan.

→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
→ Detail implementasi: [teknis.md](teknis.md)

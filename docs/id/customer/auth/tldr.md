# Autentikasi — TL;DR

**Nomor telepon adalah username.** Tidak ada alamat email di mana pun dalam
aplikasi ini. Daftar, masuk, dan atur ulang kata sandi semuanya berpatokan pada
nomor telepon Indonesia.

![Halaman depan publik](../../../assets/public-home-desktop.png)

## Lima hal yang perlu diketahui

1. **Telepon adalah identitas.** `users.phone` bersifat unik. Login memakai
   telepon + kata sandi, bukan email.
2. **Satu akun, satu role.** Pengguna adalah `customer`, `staff`, atau `admin`.
   Tidak ada pergantian, dan pendaftaran hanya bisa membuat `customer`.
3. **Petugas dan admin masuk lewat halaman berbeda.** `/internal/login` — form
   yang sama, pintu masuk terpisah. Pelanggan biasa lewat `/login`.
4. **Semuanya dibatasi laju.** Login mengizinkan 5 percobaan per menit per
   IP+telepon, lalu diblokir 5 menit. Lupa kata sandi hanya **1 permintaan per
   15 menit**.
5. **Kata sandi 8–16 karakter, hanya huruf dan angka.** Tanpa simbol — regex
   menolaknya.

## Route sekilas

| Method   | URL                | Fungsi                        |
| -------- | ------------------ | ----------------------------- |
| GET/POST | `/signup`          | Membuat akun pelanggan        |
| GET/POST | `/login`           | Login pelanggan               |
| GET      | `/internal/login`  | Halaman login petugas / admin |
| GET/POST | `/forgot-password` | Meminta tautan atur ulang     |
| GET/POST | `/reset-password`  | Menetapkan kata sandi baru    |
| POST     | `/logout`          | Mengakhiri sesi               |

## Jebakannya

**Lupa kata sandi dibatasi satu permintaan tiap 15 menit, per IP.** Saat
pengujian ini terlihat seperti fitur rusak — Anda minta tautan, salah ketik,
coba lagi, dan malah dapat galat validasi alih-alih tautan kedua. Ini memang
dirancang begitu. Tunggu, atau kosongkan tabel `rate_limits`.

Jebakan kedua: **aturan kata sandi melarang simbol.** `Password123` lolos,
`Password123!` gagal. Ini sering mengejutkan pengguna password manager.

→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)
→ Detail implementasi: [teknis.md](teknis.md)

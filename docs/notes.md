1. Gunakan labels sebagai UI saja, data yang dikirimkan tetap menggunakan value aslinya. sehingga tidak membuat kebingungan dan tetap konsisten.
2. Gunakan variants pada Transformer sehingga Transformer hanya punya dari model saja. contohnya ada di sini (https://docs.adonisjs.com/guides/frontend/transformers#defining-variants)
3. Gunakan depth pada Transformer daripada pada Controller (https://docs.adonisjs.com/guides/frontend/transformers#controlling-relationship-depth)
4. Gunakan serviceName daripada name karena terlalu rumit untuk custom seperti name = 'nama layanan'
5. Gunakan limiter route juga untuk request payment untuk melindungi sistem
6. Gunakan transmit pada Admin hanya untuk order masuk, order update, dan order terbayar saja
7. Foto memang akan dihapus setelah 90 hari
8. Gunakan totalItems karena field ini merupakan bagian dari logic frontend. Form menggunakan nilai totalItems untuk menentukan jumlah item yang harus dibuat/ditampilkan. Contoh: jika totalItems = 2, maka frontend akan menampilkan 2 form item. Jangan mengganti penggunaan totalItems dengan items.length, karena keduanya memiliki sumber dan tujuan yang berbeda
9. Buatkan signup path untuk admin atau staff, tapi khusus role admin yang bisa akses dan membuatnya
10. Tambahkan status baru bagi order yaitu "cleaning_done" untuk mereka yang offline agar tahu kapan harus diambil
11. Jadi berdasarkan nomor 10, nanti ada fitur kirim pesan ke pelanggan bahwa sepatu mereka sudah dicuci dan siap diambil di toko. khusus bagi mereka yang offline, tapi di online hanya status biasa aja tanpa ada aksi kirim WhatsApp
12. Gunakan satu shop coordinate saja sehingga ketika ganti lokasi tinggal ganti di satu file
13. Admin konfirmasi manual hanya ketika pelanggan di toko meminta bayar cash atau debit, ketika pelanggan meminta menggunakan QRIS ya tetap gunakan Midtrans. jadi ada logika lain pada webhook tersebut untuk cek apakah ini order offline atau online. 
14. Hapus sesi yang masih ada ketika reset password
15. Perbaiki flow signed URL pada fitur ganti nomor telepon agar request terikat dengan user yang membuat request. Signed URL harus menyimpan atau memvalidasi user identity (misalnya user_id), sehingga link tidak dapat digunakan oleh user lain yang sedang login.
16. Tambahkan handling ketika data berubah antara pembuatan link dan penggunaan link. Contohnya jika nomor baru sudah digunakan oleh user lain dalam waktu tunggu 15 menit, jangan biarkan database unique constraint menghasilkan error 500. Tampilkan error yang sesuai bahwa nomor tersebut sudah tidak tersedia.
17. Hapus address yang tidak terikat ke mana pun
18. Pelanggan tidak bisa pesan layanan hari ini, karena ga mungkin petugas antar jemput saat itu juga
19. Staff yang sudah resign, aksesnya diganti tanpa menghapus data yang sudah ada
20. TaskBoard harusnya hanya order number, badge, dan distance saja. untuk mengurangi petugas yang menyalin data pribadi pelanggan untuk keperluan pribadi. jadi alasan ada lock adalah mencegah hal seperti itu.
21. Gunakan claim task sebagai expired untuk 3 jam ke depan. menghitung kemacetan Bandung yang bisa sampai 1 jam dari ujung ke ujung
22. Buatkan cara agar staff bisa mengirim pesan WhatsApp tentang "Pesanan ini membutuhkan pembayaran" misal pelanggan lupa belum bayar, ntah itu otomatis atau tidak. Buatkan juga untuk pesanan yang selesai dicuci bagi pesanan offline
23. Buatkan form foto untuk offline order juga mungkin ya
24. Staff bisa membuat pesanan pelanggan yang sudah pernah pake sistem, tapi tetap datang ke toko dan meminta diantar. jadi ada ordertype tambahan. kaya walk-in_delivery atau sejenisnya.
25. Staff juga bisa mencari pelanggan yang sudah pernah daftar sistem saat input nama pelanggan. sehingga ketika sudah menemukan tinggal pilih saja tanpa harus ketika manual lagi, jadi nanti bind ke akun pelanggan.
26. Optimalkan pengecekan lock agar tidak selalu melakukan `.preload('actions')` pada setiap queue/task query. Saat jumlah order aktif masih kecil boleh dipertahankan, tetapi siapkan struktur agar pengecekan lock dapat dipindahkan ke database query atau dedicated lock state jika skala meningkat.
27. claim, complete, dan release tugas harus ada alert dialog
28. Sistem juga bisa menghitung kembalian, sehingga tidak perlu menggunakan kalkulator. jadi saat cash, pelanggan membawa 100ribu sedangkan harga hanya 88ribu maka sistem bisa menghitung itu.
29. Pada walk-in order bisa print receipt 2x untuk ditempel pada sepatu dan pelanggan

Tambahkan requirement role-based testing.

Aplikasi memiliki beberapa role:
- admin
- user
- guest
- role lain yang mungkin ditemukan dari source code

Semua test harus dipisahkan berdasarkan role agar:
- mudah mengetahui permission boundary
- mudah maintenance ketika role bertambah
- tidak mencampur behavior antar role
- memudahkan debugging ketika authorization berubah

Gunakan struktur folder:

tests/
├── unit/
│   ├── {role}/
│   └── shared/
│
├── functional/
│   ├── {role}/
│   └── shared/
│
└── browser/
    ├── {role}/
    └── shared/

Aturan pembagian:

1. Shared Test
Gunakan folder shared hanya untuk:
- logic yang berlaku untuk semua role
- utility
- service umum
- behavior yang tidak memiliki perbedaan permission

2. Role Test
Jika behavior berbeda berdasarkan role:
- buat test terpisah per role
- jangan menggunakan satu test dengan banyak conditional role

Contoh yang salah:

it('can access dashboard', () => {
  loginAs(admin || user)
  ...
})

Contoh yang benar:

browser/admin/dashboard.spec.ts
- admin dapat melihat admin dashboard
- admin dapat mengelola resource

browser/user/dashboard.spec.ts
- user dapat melihat user dashboard
- user tidak dapat mengakses admin area

3. Authorization Testing
Setiap role harus memiliki test:
- route yang boleh diakses
- route yang harus ditolak
- action yang boleh dilakukan
- action yang harus ditolak

Contoh:
admin:
✓ create user
✓ delete user
✓ access reports

user:
✓ update profile
✗ delete user
✗ access admin reports

4. Hindari duplikasi:
Jika admin dan user memiliki behavior sama:
- letakkan logic test pada shared
- tambahkan functional/browser test khusus hanya untuk perbedaan permission

5. Saat melakukan analisa source code:
Identifikasi:
- daftar role yang tersedia
- permission matrix
- route per role
- controller/action yang role-specific
- Inertia page component per role

Output tambahan:
- Role Permission Matrix
- Role → Test Coverage Mapping
- Folder Structure berdasarkan role
- Daftar test yang shared vs role-specific
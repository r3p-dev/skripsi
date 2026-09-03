# Pesanan — Teknis

## Route

Didaftarkan dengan `router.resource('orders', ...).except(['edit', 'destroy'])`
plus dua tambahan, semua parameter terikat ke `number`:

| Method | URL                       | Controller               | Nama route                |
| ------ | ------------------------- | ------------------------ | ------------------------- |
| GET    | `/orders`                 | `customer.Order.index`   | `customer.orders.index`   |
| GET    | `/orders/create`          | `customer.Order.create`  | `customer.orders.create`  |
| POST   | `/orders`                 | `customer.Order.store`   | `customer.orders.store`   |
| GET    | `/orders/:number`         | `customer.Order.show`    | `customer.orders.show`    |
| PUT    | `/orders/:number`         | `customer.Order.update`  | `customer.orders.update`  |
| GET    | `/orders/:number/receipt` | `customer.Order.receipt` | `customer.orders.receipt` |

`.params({ orders: 'number' })` membuat kunci route menjadi `order_number`,
sehingga URL terbaca `/orders/ORD2608-0496`. **`update` adalah aksi pembatalan** —
tidak ada `destroy`.

## Berkas

| Bagian      | Path                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| Controller  | [app/controllers/customer/order_controller.ts](../../../../app/controllers/customer/order_controller.ts) |
| Service     | [app/services/order_service.ts](../../../../app/services/order_service.ts)                               |
| Validator   | [app/validators/order_validator.ts](../../../../app/validators/order_validator.ts)                       |
| Transformer | [app/transformers/order_transformer.ts](../../../../app/transformers/order_transformer.ts)               |
| Enum        | [app/enums/order_enum.ts](../../../../app/enums/order_enum.ts)                                           |

## Validator

```ts
export const MAX_ITEMS_PER_ORDER = 10

orderValidator = {
  pickupDate: vine.date().after('today'),
  items: vine.array(orderItem).minLength(1).maxLength(MAX_ITEMS_PER_ORDER),
}

orderItem = {
  type: vine.enum(ItemType), // shoe | bag | helmet
  brand: string.trim().maxLength(50),
  model: string.trim().maxLength(50),
  size: string.trim().maxLength(20),
  material: string.trim().maxLength(50),
  note: string.trim().optional(),
}
```

Tidak ada pemilihan katalog/layanan pada tahap ini — itu tugas inspeksi.

## Membuat pesanan

`createOnlineOrder(user, data)`:

1. `getActiveAddress(user)` — melempar pada field `form` bila tidak ada.
2. `#assertPickupCapacity(data.pickupDate)`.
3. `createWithUniqueOrderNumber(...)` membungkus transaksi yang membuat `Order`
   lalu menyisipkan barang secara massal dengan `Item.createMany`.

Yang didenormalisasi ke pesanan saat pembuatan:

```ts
addressId:     address.id,
customerName:  address.name,     // salinan, bukan join
customerPhone: address.phone,
type:          OrderType.ONLINE,
status:        OrderStatus.PICKUP_SCHEDULED,
totalPrice:    null,
```

Nama dan telepon **disalin**, sehingga penyuntingan alamat di kemudian hari
tidak menulis ulang pesanan lama.

### Kapasitas penjemputan

```ts
export const DAILY_PICKUP_LIMIT = 10

async #assertPickupCapacity(pickupDate) {
  const scheduled = await Order.query()
    .where('pickup_date', pickupDate.toFormat('yyyy-MM-dd'))
    .where('status', OrderStatus.PICKUP_SCHEDULED)
    .count('* as total')
  if (Number(...) >= DAILY_PICKUP_LIMIT) throw E_VALIDATION_ERROR pada 'pickupDate'
}
```

Hanya baris `pickup_scheduled` yang dihitung, jadi pesanan yang sudah dijemput
melepaskan slotnya. Indeks komposit `['status', 'pickup_date']` melayani kueri
ini.

**Ini periksa-lalu-sisipkan, bukan penguncian.** Dua pemesanan bersamaan untuk
slot terakhir bisa sama-sama lolos. Masih dapat diterima pada volume sekarang;
menutupnya butuh penguncian transaksional atau exclusion constraint.

### Nomor pesanan

Format `ORD{yyLL}-{urutan}` (mis. `ORD2608-0496`). `order_number` bersifat
`unique`; `createWithUniqueOrderNumber` mencoba ulang hingga
`ORDER_NUMBER_ATTEMPTS = 3` saat terjadi duplikasi `23505`, dideteksi lewat
`isDuplicateOrderNumber`.

## Mesin status

```ts
ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pickup_scheduled: [in_pickup, cancelled],
  in_pickup: [in_inspection],
  in_inspection: [awaiting_payment],
  awaiting_payment: [in_cleaning],
  in_cleaning: [in_delivery, cleaning_done],
  cleaning_done: [completed],
  in_delivery: [completed],
  completed: [],
  cancelled: [],
}
```

`nextStatuses` memberi perlakuan khusus pada `in_cleaning`, menciutkan dua
pilihan menjadi satu berdasarkan kelayakan antar:

```ts
isDeliverable(order) {
  return DELIVERABLE_TYPES.includes(order.type) && order.addressId !== null
}
// DELIVERABLE_TYPES = [ONLINE, WALK_IN_DELIVERY]
```

`transitionTo` kembali lebih awal bila status tidak berubah, lalu menolak apa pun
yang tidak ada di `nextStatuses` dengan `E_VALIDATION_ERROR` pada `status`.

## Penjaga

```ts
canPay(order) // awaiting_payment && Number(totalPrice ?? 0) > 0
canCancel(order) // pickup_scheduled && pickupDate && pickupDate > hari ini
```

`cancelOrder` memeriksa ulang `canCancel` di sisi server sebelum berpindah ke
`cancelled` — penanda di UI tidak dipercaya.

## Membaca pesanan

- `getCustomerOrders(user)` — `where user_id`, terbaru dulu, tanpa preload.
- `itemSummaries(orderIds)` — satu kueri berkelompok atas `items` yang
  mengembalikan `Map<orderId, "2 Sepatu, 1 Tas">`. Sengaja dikelompokkan untuk
  menghindari N+1 di halaman daftar.
- `getCustomerOrderByNumber(user, number)` — dibatasi `user_id`, mem-preload
  `address` dan `items.orderItems`. Pembatasan per user inilah pemeriksaan
  kepemilikan; nomor milik pelanggan lain menghasilkan 404.

Varian transformer: `toObject` (bawaan), `toQueue`, `toListItem`, `toDetail`.
Semua relasi melalui `whenLoaded`, jadi preload yang tidak ada menghasilkan
kosong alih-alih kueri malas.

## Realtime

Halaman pesanan berlangganan `orders/{orderNumber}` lewat SSE. Otorisasi ada di
[start/routes.ts](../../../../start/routes.ts): petugas boleh berlangganan
pesanan mana pun, pelanggan hanya yang `order.userId === user.id`.

## Kasus tepi

- **`totalPrice` bernilai `null` sampai inspeksi**, dan kolomnya nullable. Apa
  pun yang menjumlahkannya harus melakukan coalesce.
- **`user_id` dan `address_id` nullable** pada `orders` — pesanan konter bisa
  tidak punya keduanya.
- **Pembatalan memakai `PUT`**, mengikuti route resource dengan `destroy`
  dikecualikan.
- **`pickup_date` bertipe `date`**, bukan timestamp; perbandingan memakai
  `startOf('day')`.
- Perlombaan kapasitas penjemputan di atas memang tidak dijaga.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)

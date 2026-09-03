# Pesanan Konter — Teknis

## Route

| Method | URL                             | Controller              | Nama route              |
| ------ | ------------------------------- | ----------------------- | ----------------------- |
| GET    | `/staff/orders/create`          | `staff.Order.create`    | `staff.order.create`    |
| POST   | `/staff/orders`                 | `staff.Order.store`     | `staff.order.store`     |
| GET    | `/staff/orders/:number/edit`    | `staff.Order.edit`      | `staff.order.edit`      |
| PUT    | `/staff/orders/:number`         | `staff.Order.update`    | `staff.order.update`    |
| GET    | `/staff/orders/:number/receipt` | `staff.Order.receipt`   | `staff.order.receipt`   |
| GET    | `/staff/customers`              | `staff.Order.customers` | `staff.customers.index` |

## Berkas

| Bagian     | Path                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| Controller | [app/controllers/staff/order_controller.ts](../../../../app/controllers/staff/order_controller.ts)                  |
| Service    | [app/services/task_service.ts](../../../../app/services/task_service.ts)                                            |
| Validator  | `offlineOrderValidator`, `orderItemsValidator` di [task_validator.ts](../../../../app/validators/task_validator.ts) |

## Validator

```ts
export const offlineOrderValidator = vine.create({
  customerId: vine.number().positive().optional(),
  name: name(),
  phone: phone(),
  delivery: vine.boolean().optional(),
  items: vine.array(inspectedItem).minLength(1).maxLength(MAX_ITEMS_PER_ORDER),
  photo: image(),
  note: note(),
  paymentMethod: vine.enum(Object.values(PaymentMethod)),
  cashReceived: vine
    .number()
    .positive()
    .optional()
    .requiredWhen('paymentMethod', '=', PaymentMethod.CASH),
})
```

`inspectedItem` adalah objek yang sama dipakai inspeksi, sehingga barang
dijelaskan secara identik di kedua alur.

## Membuat pesanan konter

```ts
async createOfflineOrder(user, data) {
  const catalogues = await this.catalogueService.resolveForSelections(data.items)
  const address = await this.#resolveCounterAddress(data)
  const photoPath = await this.#storePhoto(data.photo)

  return this.orderService.createWithUniqueOrderNumber((orderNumber) =>
    db.transaction(async (trx) => {
      const order = await Order.create({
        userId: data.customerId ?? null,
        addressId: address?.id ?? null,
        customerName: data.name,
        customerPhone: data.phone,
        orderNumber,
        pickupDate: null,
        type: address ? OrderType.WALK_IN_DELIVERY : OrderType.OFFLINE,
        status: OrderStatus.IN_CLEANING,     // langsung ke antrean cuci
        totalPrice: null,
      }, { client: trx })

      let total = 0
      for (const entry of data.items) {
        total += await this.#recordInspectedItem(order, entry, catalogues, trx)
      }

      order.merge({ totalPrice: total.toString() })
      order.useTransaction(trx)
      await order.save()

      await Transaction.create({
        orderId: order.id,
        paymentMethod: data.paymentMethod,
        status: TransactionStatus.PAID,      // lahir sudah lunas
        cashReceived: data.cashReceived?.toString() ?? null,
        midtransOrderId: null, midtransTransactionId: null, qrCode: null,
      }, { client: trx })

      await this.#recordAction(order, user, ActionName.OFFLINE_ORDER, trx, photoPath, data.note)
      return order
    })
  )
}
```

Poin utama:

- **Status awalnya `IN_CLEANING`**, melewati `pickup_scheduled`, `in_pickup`,
  `in_inspection`, dan `awaiting_payment`. `transitionTo` tidak pernah dipanggil,
  jadi mesin status tidak dilanggar — pesanannya sekadar dimulai lebih jauh.
- **`pickupDate` bernilai `null`**, sehingga pesanan konter tidak pernah memakan
  `DAILY_PICKUP_LIMIT`.
- **Transaksi `paid` dibuat di dalam transaksi yang sama**, memenuhi
  `transactions_order_id_paid_unique` sejak awal.
- Tipenya `WALK_IN_DELIVERY` bila alamat berhasil ditentukan, selain itu
  `OFFLINE`. `WALK_IN_TYPES = [OFFLINE, WALK_IN_DELIVERY]`.

## Menentukan alamat pengantaran

```ts
async #resolveCounterAddress(data) {
  if (!data.delivery) return null

  const customer = data.customerId ? await UserModel.find(data.customerId) : null
  if (!customer) {
    throw E_VALIDATION_ERROR pada 'delivery'
      // 'Pengantaran memerlukan akun pelanggan. Pilih akun terlebih dahulu.'
  }

  const address = await this.addressService.getActiveAddress(customer)
  if (!address) {
    throw E_VALIDATION_ERROR pada 'delivery'
      // 'Akun pelanggan ini belum memiliki alamat tersimpan.'
  }

  return address
}
```

Dua pesan berbeda — tanpa akun versus tanpa alamat — supaya petugas tahu mana
yang perlu dibetulkan. **Tidak pernah diam-diam diturunkan** menjadi
diambil-di-toko.

## Pencarian pelanggan

```ts
async findCustomers(search: string): Promise<User[]> {
  const term = search.trim()
  if (term.length < 3) return []

  return UserModel.query()
    .where('role', Role.CUSTOMER)
    .where('is_active', true)
    .where((query) => {
      query.whereILike('name', `%${term}%`).orWhereILike('phone', `%${term}%`)
    })
    .orderBy('name', 'asc')
    .limit(10)
}
```

Mengembalikan JSON (`id`, `name`, `phone`), bukan halaman Inertia — ini memberi
makan autocomplete.

`ILIKE` berawalan wildcard inilah sebabnya `users` membawa indeks trigram GIN
(`users_name_trgm_index`, `users_phone_trgm_index`); tidak ada indeks btree yang
bisa melayani `%term%`.

## Mengoreksi barang

```ts
async updateOrderItems(order, data) {
  if (order.status !== OrderStatus.AWAITING_PAYMENT) {
    throw E_VALIDATION_ERROR pada 'form'
      // 'Barang hanya dapat diubah selagi pesanan menunggu pelunasan.'
  }

  const catalogues = await this.catalogueService.resolveForSelections(data.items)

  return db.transaction(async (trx) => {
    await Item.query({ client: trx }).where('order_id', order.id).delete()
    let total = 0
    for (const entry of data.items) {
      total += await this.#recordInspectedItem(order, entry, catalogues, trx)
    }
    order.merge({ totalPrice: total.toString() })
    order.useTransaction(trx)
    await order.save()
    return order
  })
}
```

**Penjaga `AWAITING_PAYMENT` membuat ini tidak pernah berlaku untuk pesanan
konter**, yang dibuat di `IN_CLEANING`. Meski berada di controller order milik
staff, fungsi ini melayani pesanan online antara inspeksi dan pembayaran.

Penghargaan ulang penuh, tidak pernah bertahap. Tanpa perubahan status dan tanpa
catatan aksi.

## Struk dan kembalian

```ts
changeFor(order, transaction) {
  if (!transaction?.cashReceived) return 0
  return Math.max(0, Number(transaction.cashReceived) - Number(order.totalPrice ?? 0))
}
```

Dibatasi minimal nol, dan mengembalikan `0` untuk metode non-tunai.

## Kasus tepi

- **`userId` bernilai `null` untuk pelanggan langsung tanpa akun.** Pesanan itu
  tidak pernah muncul di riwayat pelanggan mana pun.
- **`customerName`/`customerPhone` berasal dari form**, bukan dari akun yang
  ditautkan — petugas bisa mencatat pengambil yang berbeda.
- **Pesanan `OFFLINE` murni tidak bisa diantar** (`DELIVERABLE_TYPES` tidak
  memuatnya), jadi ia selalu berakhir di `cleaning_done`.
- **Foto disimpan sebelum transaksi**, jadi rollback membuat berkas yatim.
- **`edit`/`update` dapat dijangkau untuk nomor pesanan mana pun**; penjaga
  status adalah satu-satunya perlindungan, dan ia berada di service.

→ Versi satu menit: [tldr.md](tldr.md)
→ Penjelasan bahasa sehari-hari: [panduan.md](panduan.md)

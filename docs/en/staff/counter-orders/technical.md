# Counter Orders — Technical

## Routes

| Method | URL                             | Controller              | Route name              |
| ------ | ------------------------------- | ----------------------- | ----------------------- |
| GET    | `/staff/orders/create`          | `staff.Order.create`    | `staff.order.create`    |
| POST   | `/staff/orders`                 | `staff.Order.store`     | `staff.order.store`     |
| GET    | `/staff/orders/:number/edit`    | `staff.Order.edit`      | `staff.order.edit`      |
| PUT    | `/staff/orders/:number`         | `staff.Order.update`    | `staff.order.update`    |
| GET    | `/staff/orders/:number/receipt` | `staff.Order.receipt`   | `staff.order.receipt`   |
| GET    | `/staff/customers`              | `staff.Order.customers` | `staff.customers.index` |

## Files

| Concern    | Path                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| Controller | [app/controllers/staff/order_controller.ts](../../../../app/controllers/staff/order_controller.ts)                  |
| Service    | [app/services/task_service.ts](../../../../app/services/task_service.ts)                                            |
| Validators | `offlineOrderValidator`, `orderItemsValidator` in [task_validator.ts](../../../../app/validators/task_validator.ts) |

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

`inspectedItem` is the same object used by inspection, so goods are described
identically in both flows.

## Creating a counter order

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
        status: OrderStatus.IN_CLEANING,     // straight to the wash queue
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
        status: TransactionStatus.PAID,      // born paid
        cashReceived: data.cashReceived?.toString() ?? null,
        midtransOrderId: null, midtransTransactionId: null, qrCode: null,
      }, { client: trx })

      await this.#recordAction(order, user, ActionName.OFFLINE_ORDER, trx, photoPath, data.note)
      return order
    })
  )
}
```

Key points:

- **Initial status is `IN_CLEANING`**, bypassing `pickup_scheduled`, `in_pickup`,
  `in_inspection`, and `awaiting_payment`. `transitionTo` is never called, so the
  state machine is not violated — the order simply starts further along.
- **`pickupDate` is `null`**, so counter orders never consume
  `DAILY_PICKUP_LIMIT`.
- **The `paid` transaction is created inside the same transaction**, satisfying
  `transactions_order_id_paid_unique` from the start.
- Type is `WALK_IN_DELIVERY` when an address resolved, otherwise `OFFLINE`.
  `WALK_IN_TYPES = [OFFLINE, WALK_IN_DELIVERY]`.

## Resolving the delivery address

```ts
async #resolveCounterAddress(data) {
  if (!data.delivery) return null

  const customer = data.customerId ? await UserModel.find(data.customerId) : null
  if (!customer) {
    throw E_VALIDATION_ERROR on 'delivery'
      // 'Pengantaran memerlukan akun pelanggan. Pilih akun terlebih dahulu.'
  }

  const address = await this.addressService.getActiveAddress(customer)
  if (!address) {
    throw E_VALIDATION_ERROR on 'delivery'
      // 'Akun pelanggan ini belum memiliki alamat tersimpan.'
  }

  return address
}
```

Two distinct messages — no account versus no address — so staff know which to
fix. **Never silently downgrades** to collect-at-shop.

## Customer search

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

Returns JSON (`id`, `name`, `phone`), not an Inertia page — it feeds an
autocomplete.

The leading-wildcard `ILIKE` is why `users` carries trigram GIN indexes
(`users_name_trgm_index`, `users_phone_trgm_index`); no btree index can serve
`%term%`.

## Correcting goods

```ts
async updateOrderItems(order, data) {
  if (order.status !== OrderStatus.AWAITING_PAYMENT) {
    throw E_VALIDATION_ERROR on 'form'
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

**The `AWAITING_PAYMENT` guard means this never applies to counter orders**,
which are created at `IN_CLEANING`. Despite living in the staff order
controller, it serves online orders between inspection and payment.

Full re-price, never incremental. No status change and no action record.

## Receipt and change

```ts
changeFor(order, transaction) {
  if (!transaction?.cashReceived) return 0
  return Math.max(0, Number(transaction.cashReceived) - Number(order.totalPrice ?? 0))
}
```

Clamped at zero, and returns `0` for non-cash methods.

## Edge cases

- **`userId` is `null` for account-less walk-ins.** Those orders never appear in
  any customer's history.
- **`customerName`/`customerPhone` come from the form**, not from the linked
  account — staff can record a different collector.
- **A plain `OFFLINE` order is not deliverable** (`DELIVERABLE_TYPES` excludes
  it), so it always ends at `cleaning_done`.
- **Photo is stored before the transaction**, so a rollback orphans the file.
- **`edit`/`update` are reachable for any order number**; the status guard is the
  only protection, and it lives in the service.

→ One-minute version: [tldr.md](tldr.md)
→ Plain-language walkthrough: [guide.md](guide.md)

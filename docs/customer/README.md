# Customer

The customer app is what a paying customer opens on their phone. It is
mobile-first (`max-w-md`, bottom tab bar), Indonesian-only, and deliberately
small: four things to do and nothing else.

## Feature documents

| Document                    | Covers                                                                       |
| --------------------------- | ---------------------------------------------------------------------------- |
| [account.md](account.md)    | Signup, login, WhatsApp password reset, phone-number change, profile          |
| [address.md](address.md)    | The single active address, map pinpointing, and the service-area check        |
| [order.md](order.md)        | Booking a pickup, daily capacity, tracking, cancelling, the receipt           |
| [payment.md](payment.md)    | QRIS charge, the Midtrans webhook, live status, retry after expiry            |

## Routes at a glance

Customer routes are registered with `.as(Role.CUSTOMER)` but **no URL prefix** —
they sit at the root of the domain.

| Method | URL                              | Route name                    | Controller                                                                                  |
| ------ | -------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------- |
| GET    | `/profile`                       | `customer.profile.show`       | [`customer/profile_controller.ts`](../../app/controllers/customer/profile_controller.ts)     |
| PUT    | `/profile`                       | `customer.profile.update`     | ″ (change name)                                                                             |
| POST   | `/phone`                         | `customer.phone.store`        | [`customer/phone_controller.ts`](../../app/controllers/customer/phone_controller.ts)         |
| GET    | `/phone/verify`                  | `customer.phone.update`       | ″ (signed link)                                                                             |
| PUT    | `/password`                      | `customer.password.update`    | [`customer/password_controller.ts`](../../app/controllers/customer/password_controller.ts)   |
| GET    | `/address`                       | `customer.address.show`       | [`customer/address_controller.ts`](../../app/controllers/customer/address_controller.ts)     |
| GET    | `/address/create`                | `customer.address.create`     | ″                                                                                           |
| POST   | `/address`                       | `customer.address.store`      | ″                                                                                           |
| GET    | `/order`                         | `customer.order.create`       | [`customer/order_controller.ts`](../../app/controllers/customer/order_controller.ts)         |
| POST   | `/orders`                        | `customer.order.store`        | ″                                                                                           |
| GET    | `/orders`                        | `customer.order.index`        | ″                                                                                           |
| GET    | `/orders/:number`                | `customer.order.show`         | ″                                                                                           |
| PUT    | `/orders/:number`                | `customer.order.update`       | ″ (cancel)                                                                                  |
| GET    | `/orders/:number/receipt`        | `customer.order.receipt`      | ″                                                                                           |
| POST   | `/orders/:number/transactions`   | `customer.transaction.store`  | [`customer/transaction_controller.ts`](../../app/controllers/customer/transaction_controller.ts) |
| GET    | `/orders/:number/transactions/latest` | `customer.transaction.show` | ″                                                                                        |

All of them sit behind `middleware.auth()` + `middleware.role(Role.CUSTOMER)`.
A staff member or admin who lands on one is bounced to their own home screen by
[`role_middleware.ts`](../../app/middleware/role_middleware.ts) with the flash
`"Anda tidak memiliki akses ke halaman ini"`.

## Navigation

[`customer_layout.tsx`](../../inertia/components/layouts/customer_layout.tsx)
renders a three-tab bottom bar:

| Tab       | Route                   | Also highlighted on                                       |
| --------- | ----------------------- | --------------------------------------------------------- |
| Pesan     | `customer.order.create` | —                                                         |
| Pesanan   | `customer.order.index`  | order show, receipt                                       |
| Profil    | `customer.profile.show` | address show, address create                              |

The payment page is **outside** this layout on purpose — it is shared with the
staff app so a staff member can present the same QR screen at the counter.

## Ownership rules

Every customer-facing read is scoped by passing `user` into the service:

```ts
Order.query().if(user, (q) => q.where('user_id', user!.id))...
```

So `/orders/ORD260728-004` for someone else's order is a 404, not a 403 — the
query simply doesn't find it. The same applies to addresses: `createOnlineOrder`
re-checks that the submitted `addressId` belongs to the signed-in user, because
that field arrives from a hidden input and cannot be trusted.

import ServiceSeeder from '#database/seeders/service_seeder'
import UserSeeder from '#database/seeders/user_seeder'
import { ActionName } from '#enums/order_action_enum'
import { OrderStatus } from '#enums/order_status_enum'
import { OrderType } from '#enums/order_type_enum'
import { Role } from '#enums/role_enum'
import { ItemType, ServiceCategory } from '#enums/service_enum'
import { PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import Address from '#models/address'
import Item from '#models/item'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import OrderItem from '#models/order_item'
import Service from '#models/service'
import Transaction from '#models/transaction'
import User from '#models/user'
import type { TaskType } from '#services/task_service'
import logger from '@adonisjs/core/services/logger'
import router from '@adonisjs/core/services/router'
import drive from '@adonisjs/drive/services/main'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import { deflateSync } from 'node:zlib'

/**
 * A shop with one of everything in it, for showing the system to someone who
 * wants to click through it rather than read about it.
 *
 * The other two seeders load what a real shop starts its first day with: the
 * price list and one admin account. This one loads what a shop looks like on
 * an ordinary Tuesday — every role signed up, every order status somewhere in
 * the pipeline, every action in some order's history, and every payment state
 * a transaction can end up in — plus one quoted order left deliberately
 * uncharged, which is the only one that reaches Midtrans when somebody presses
 * pay. Nothing here goes through the services: the rows are written directly so
 * seeding never charges Midtrans, sends a WhatsApp message, or broadcasts to a
 * listener that isn't there.
 *
 * It is `development`-only and refuses to run twice, so it can never be the
 * thing that puts invented orders into a real shop's books.
 */

/**
 * The one password every demo account shares, so nothing has to be looked up
 * mid-demonstration. The admin from `user_seeder` keeps its own.
 */
const DEMO_PASSWORD = 'demo12345'

/**
 * Staff, including one deactivated account.
 *
 * `is_active` is the difference between somebody who has left and somebody who
 * never existed: their name has to stay readable on every action they ever
 * recorded, while their sign-in stops working.
 *
 * The first one holds no claim, deliberately. A staff member who is already
 * holding a task is sent straight back to it on sign-in, so if every account
 * held one there would be no way to reach the queue without releasing
 * somebody's work first — and the queue is the screen worth seeing.
 */
const STAFF = [
  { key: 'bagas', name: 'Bagas Prakoso', phone: '081300000001', isActive: true },
  { key: 'dewi', name: 'Dewi Lestari', phone: '081300000002', isActive: true },
  { key: 'yoga', name: 'Yoga Saputra', phone: '081300000003', isActive: true },
  { key: 'ilham', name: 'Ilham Kurniawan', phone: '081300000004', isActive: true },
  { key: 'putra', name: 'Putra Handoko', phone: '081300000005', isActive: true },
  { key: 'rina', name: 'Rina Oktaviani', phone: '081300000006', isActive: false },
]

/**
 * A second admin beside the one `user_seeder` creates, so the admin user list
 * has more than a single row in it and the "you cannot deactivate yourself"
 * rule has somebody else to be demonstrated against.
 */
const ADMINS = [{ key: 'sari', name: 'Sari Handayani', phone: '081200000002', isActive: true }]

/**
 * An address inside the service area. Coordinates are real Bandung
 * neighbourhoods around the shop, so the map pins land where they should and
 * the trip queue's nearest-first ordering has something to sort.
 */
type DemoAddress = {
  street: string
  latitude: number
  longitude: number
  note: string | null
}

/**
 * Customers, each with the thing they exist to demonstrate.
 *
 * `retiredAddress` is an address the customer has since replaced. It survives
 * because an old order still points at it — the record of where those shoes
 * were actually collected from — which is exactly the case the address
 * clean-up is written to leave alone.
 */
const CUSTOMERS: {
  key: string
  name: string
  phone: string
  isActive: boolean
  address: DemoAddress | null
  retiredAddress?: DemoAddress
}[] = [
  {
    /**
     * The tour account. Orders are spread across everybody below so each list
     * reads like a real customer's history, which leaves no single one of them
     * showing the whole lifecycle — so this customer is deliberately given an
     * order in every status, including a counter order sitting on the shelf.
     * Sign in here to see the statuses; sign in as anybody else to see what an
     * ordinary history looks like.
     */
    key: 'andi',
    name: 'Andi Nugroho',
    phone: '081400000001',
    isActive: true,
    address: {
      street: 'Jl. Ir. H. Juanda No. 112, Dago, Coblong',
      latitude: -6.889,
      longitude: 107.613,
      note: 'Pagar hitam, sebelah warung kopi.',
    },
  },
  {
    key: 'siti',
    name: 'Siti Rahayu',
    phone: '081400000002',
    isActive: true,
    address: {
      street: 'Jl. Terusan Jakarta No. 45, Antapani Kidul',
      latitude: -6.9151,
      longitude: 107.6603,
      note: 'Titip ke satpam bila tidak ada orang.',
    },
  },
  {
    key: 'budi',
    name: 'Budi Santoso',
    phone: '081400000003',
    isActive: true,
    address: {
      street: 'Jl. Buah Batu No. 210, Turangga, Lengkong',
      latitude: -6.9463,
      longitude: 107.6438,
      note: null,
    },
  },
  {
    key: 'maya',
    name: 'Maya Puspita',
    phone: '081400000004',
    isActive: true,
    address: {
      street: 'Jl. Sukajadi No. 88, Pasteur, Sukajadi',
      latitude: -6.8917,
      longitude: 107.592,
      note: 'Rumah cat putih, pagar dua daun.',
    },
  },
  {
    key: 'fajar',
    name: 'Fajar Ramadhan',
    phone: '081400000005',
    isActive: true,
    address: {
      street: 'Jl. AH Nasution No. 17, Ujungberung',
      latitude: -6.9075,
      longitude: 107.7046,
      note: null,
    },
  },
  {
    key: 'nadia',
    name: 'Nadia Safitri',
    phone: '081400000006',
    isActive: true,
    address: {
      street: 'Jl. Gedebage Selatan No. 9, Rancabolang',
      latitude: -6.9439,
      longitude: 107.6931,
      note: 'Masuk gang, rumah kedua dari ujung.',
    },
    retiredAddress: {
      street: 'Jl. Cibiru Hilir No. 33, Cileunyi',
      latitude: -6.921,
      longitude: 107.72,
      note: 'Alamat kos yang lama.',
    },
  },
  {
    // Registered, but has never given an address: walk-in only, no delivery.
    key: 'hendra',
    name: 'Hendra Wijaya',
    phone: '081400000007',
    isActive: true,
    address: null,
  },
  {
    // Deactivated account with an order history that must remain readable.
    key: 'lina',
    name: 'Lina Marlina',
    phone: '081400000008',
    isActive: false,
    address: {
      street: 'Jl. Cihanjuang No. 21, Cimahi Utara',
      latitude: -6.883,
      longitude: 107.542,
      note: null,
    },
  },
]

/**
 * One inspected or counter-recorded item: its physical description, the
 * service it was booked for, and any extras added on top.
 *
 * The item's `type` is not stated here for the same reason the inspection form
 * does not ask for it — it follows from the category of the service chosen, so
 * a helmet can never end up filed as a shoe.
 *
 * `additional` draws only on the `ADDITIONAL` category, because that is the
 * split the inspection form itself makes: a main service is picked from the
 * categories an item can belong to, and everything in `ADDITIONAL` is offered
 * alongside it. A service priced as an add-on but filed under `SHOE_WASH` —
 * Unyellowing, say — is a main service as far as the form is concerned, so
 * putting it here would build an order staff could not have booked.
 */
type Line = {
  brand: string
  model: string
  material: string
  size: string
  condition: string
  note?: string
  service: string
  additional?: string[]
}

/**
 * One entry in an order's audit trail. A photo is attached automatically for
 * the four actions that are completed by taking one.
 */
type Step = {
  name: ActionName
  staff: string
  hoursAfter: number
  note?: string
}

/**
 * One payment attempt against an order.
 *
 * `cash` decides what the customer handed over: the exact amount, or a round
 * note that leaves change to give back.
 */
type Payment = {
  method: PaymentMethod
  status: TransactionStatus
  hoursAfter: number
  cash?: 'exact' | 'change'
}

type Blueprint = {
  /** What this order is here to show, printed in the summary at the end. */
  shows: string
  customer?: string
  guest?: { name: string; phone: string }
  address?: 'active' | 'retired'
  type: OrderType
  status: OrderStatus
  createdHoursAgo: number
  /** Days from today, negative for a pickup that was missed. */
  pickupInDays?: number
  items?: Line[]
  steps?: Step[]
  lock?: { staff: string; task: TaskType; expiresInHours: number }
  payments?: Payment[]
}

const HOURS_PER_DAY = 24

/**
 * The item descriptions the blueprints draw on, kept apart so the orders below
 * stay readable as lifecycles rather than as inventories.
 */
const SNEAKER: Line = {
  brand: 'Nike',
  model: 'Air Force 1',
  material: 'Kulit sintetis',
  size: '42',
  condition: 'Kotor di bagian midsole dan tali.',
  service: 'Medium',
  additional: ['One Day Service'],
}

const RUNNER: Line = {
  brand: 'Adidas',
  model: 'Ultraboost',
  material: 'Primeknit',
  size: '41',
  condition: 'Noda lumpur di upper, sol masih rapat.',
  service: 'Mild',
}

const SUEDE: Line = {
  brand: 'Puma',
  model: 'Suede Classic',
  material: 'Suede',
  size: '43',
  condition: 'Bahan suede kusam, perlu penanganan khusus.',
  note: 'Jangan disikat keras, bahan mudah botak.',
  service: 'Premium For Suede',
  additional: ['One Day Service'],
}

const BOOT: Line = {
  brand: 'Brodo',
  model: 'Signore',
  material: 'Kulit sapi',
  size: '43',
  condition: 'Midsole menguning dan warnanya sudah tidak rata.',
  service: 'Midsole Repaint / Recolour',
}

const FADED: Line = {
  brand: 'Vans',
  model: 'Old Skool',
  material: 'Kanvas',
  size: '40',
  condition: 'Warna hitam sudah memudar kecoklatan.',
  service: 'Premium Repaint',
}

const TOTE: Line = {
  brand: 'Eiger',
  model: 'Daypack Nomad',
  material: 'Kanvas',
  size: 'L',
  condition: 'Bau apek dan noda tinta di kantong depan.',
  service: 'Large Canvas/Fabric',
}

const HELMET: Line = {
  brand: 'KYT',
  model: 'TT Course',
  material: 'Polikarbonat',
  size: 'L',
  condition: 'Busa dalam berbau, visor berjamur.',
  service: 'Helmet SPA Premium',
}

const SCHOOL_SHOES: Line = {
  brand: 'Ardiles',
  model: 'Sekolah Hitam',
  material: 'Kanvas',
  size: '38',
  condition: 'Kotor merata dengan noda membandel di bahan kanvas.',
  service: 'Hard',
}

/**
 * The chain of actions an online order walks through, as a function of when it
 * started. Written once because eight of the orders below share it and a
 * timeline that disagrees with itself between two orders is worse than no
 * timeline at all.
 */
function pickedUp(staff: string, from = 0): Step[] {
  return [
    { name: ActionName.ATTEMPT_PICKUP, staff, hoursAfter: from + 16 },
    { name: ActionName.PICKUP, staff, hoursAfter: from + 17 },
  ]
}

function inspected(staff: string, from = 0): Step[] {
  return [
    { name: ActionName.ATTEMPT_INSPECTION, staff, hoursAfter: from + 19 },
    { name: ActionName.INSPECTION, staff, hoursAfter: from + 20 },
  ]
}

function washed(staff: string, from = 0): Step[] {
  return [{ name: ActionName.CLEANING_DONE, staff, hoursAfter: from + 40 }]
}

function delivered(staff: string, from = 0): Step[] {
  return [
    { name: ActionName.ATTEMPT_DELIVERY, staff, hoursAfter: from + 44 },
    { name: ActionName.DELIVERY, staff, hoursAfter: from + 45 },
  ]
}

/**
 * The shop as it stands right now.
 *
 * Read top to bottom it is the order lifecycle: booked, collected, inspected,
 * quoted, paid, washed, handed back. Every status appears at least once, every
 * action name is recorded somewhere, and the payments between them cover all
 * five transaction states across all three payment methods.
 */
const ORDERS: Blueprint[] = [
  /**
   * Waiting to be collected. Four of them, spread across the pickup calendar
   * so the dashboard's daily-load chart has a shape and the trip queue has
   * both a stop for today and one that was missed yesterday.
   */
  {
    shows: 'Booked pickup, still cancellable by the customer',
    customer: 'andi',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.PICKUP_SCHEDULED,
    createdHoursAgo: 5,
    pickupInDays: 2,
  },
  {
    shows: 'Pickup due today, free in the trip queue',
    customer: 'siti',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.PICKUP_SCHEDULED,
    createdHoursAgo: 28,
    pickupInDays: 0,
  },
  {
    shows: 'Overdue pickup, missed yesterday and still queued',
    customer: 'budi',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.PICKUP_SCHEDULED,
    createdHoursAgo: 52,
    pickupInDays: -1,
  },
  {
    shows: 'Claimed then released — the lapsed-claim audit trail',
    customer: 'maya',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.PICKUP_SCHEDULED,
    createdHoursAgo: 30,
    pickupInDays: 1,
    steps: [
      { name: ActionName.ATTEMPT_PICKUP, staff: 'yoga', hoursAfter: 26 },
      { name: ActionName.RELEASE_PICKUP, staff: 'yoga', hoursAfter: 27 },
    ],
  },

  /**
   * Out on the road. The lock is what keeps two staff from driving to the same
   * address, and the status is what the customer sees while it holds.
   */
  {
    shows: 'Pickup claimed right now — locked to a staff member',
    customer: 'fajar',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.IN_PICKUP,
    createdHoursAgo: 20,
    pickupInDays: 0,
    steps: [{ name: ActionName.ATTEMPT_PICKUP, staff: 'dewi', hoursAfter: 19 }],
    lock: { staff: 'dewi', task: ActionName.PICKUP, expiresInHours: 2 },
  },
  {
    shows: 'Pickup claimed right now, for the tour account',
    customer: 'andi',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.IN_PICKUP,
    createdHoursAgo: 22,
    pickupInDays: 0,
    steps: [{ name: ActionName.ATTEMPT_PICKUP, staff: 'putra', hoursAfter: 21 }],
    lock: { staff: 'putra', task: ActionName.PICKUP, expiresInHours: 2 },
  },

  /**
   * On the bench waiting to be looked at. One free, one being inspected by
   * somebody who already handed it back once.
   */
  {
    shows: 'Collected, waiting in the inspection queue',
    customer: 'nadia',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.IN_INSPECTION,
    createdHoursAgo: 26,
    pickupInDays: -1,
    steps: pickedUp('bagas'),
  },
  {
    shows: 'Inspection claimed after an earlier one was released',
    customer: 'andi',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.IN_INSPECTION,
    createdHoursAgo: 27,
    pickupInDays: -1,
    steps: [
      ...pickedUp('yoga'),
      { name: ActionName.ATTEMPT_INSPECTION, staff: 'rina', hoursAfter: 19 },
      { name: ActionName.RELEASE_INSPECTION, staff: 'rina', hoursAfter: 20 },
      { name: ActionName.ATTEMPT_INSPECTION, staff: 'ilham', hoursAfter: 26 },
    ],
    lock: { staff: 'ilham', task: ActionName.INSPECTION, expiresInHours: 1 },
  },

  /**
   * Quoted and waiting for the money. The three ways that wait ends up going:
   * a QR code still open, a charge that expired, and one that was cancelled
   * and then failed — the last two being what the reconciliation screen exists
   * to clear up.
   */
  {
    shows: 'Quoted, QRIS still open — the live payment page',
    customer: 'siti',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.AWAITING_PAYMENT,
    createdHoursAgo: 30,
    pickupInDays: -1,
    items: [SNEAKER, HELMET],
    steps: [...pickedUp('bagas'), ...inspected('dewi')],
    payments: [{ method: PaymentMethod.QRIS, status: TransactionStatus.PENDING, hoursAfter: 21 }],
  },
  {
    shows: 'Quoted and payable, for the tour account',
    customer: 'andi',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.AWAITING_PAYMENT,
    createdHoursAgo: 46,
    pickupInDays: -1,
    items: [SCHOOL_SHOES, HELMET],
    steps: [...pickedUp('bagas'), ...inspected('ilham')],
    payments: [{ method: PaymentMethod.QRIS, status: TransactionStatus.PENDING, hoursAfter: 21 }],
  },
  {
    /**
     * The one payable order with no transaction against it at all, and the
     * only way through this seeder that reaches Midtrans.
     *
     * Everywhere else a quoted order already carries a seeded PENDING charge,
     * and `createQrisTransaction` hands an existing pending row straight back
     * rather than charging again — so pressing "Bayar Sekarang" on those
     * returns the drawn placeholder QR, which scans as nothing and will never
     * produce a callback. Starting from nothing is what makes this one issue a
     * real charge, a real scannable QR, and a notification worth waiting for.
     */
    shows: 'Quoted with nothing charged yet — the live Midtrans QRIS test',
    customer: 'andi',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.AWAITING_PAYMENT,
    createdHoursAgo: 32,
    pickupInDays: -1,
    items: [SNEAKER],
    steps: [...pickedUp('putra'), ...inspected('dewi')],
  },
  {
    shows: 'Expired charge, items corrected, reminder already sent',
    customer: 'budi',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.AWAITING_PAYMENT,
    createdHoursAgo: 54,
    pickupInDays: -2,
    items: [BOOT, SCHOOL_SHOES],
    steps: [
      ...pickedUp('yoga'),
      ...inspected('yoga'),
      { name: ActionName.ITEMS_EDITED, staff: 'dewi', hoursAfter: 23 },
      { name: ActionName.PAYMENT_REMINDER_SENT, staff: 'dewi', hoursAfter: 46 },
    ],
    payments: [{ method: PaymentMethod.QRIS, status: TransactionStatus.EXPIRED, hoursAfter: 21 }],
  },
  {
    shows: 'Cancelled then failed charge — stuck awaiting payment',
    customer: 'maya',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.AWAITING_PAYMENT,
    createdHoursAgo: 76,
    pickupInDays: -3,
    items: [SUEDE],
    steps: [...pickedUp('bagas'), ...inspected('bagas')],
    payments: [
      { method: PaymentMethod.QRIS, status: TransactionStatus.CANCELLED, hoursAfter: 21 },
      { method: PaymentMethod.QRIS, status: TransactionStatus.FAILED, hoursAfter: 30 },
    ],
  },

  /**
   * Paid for and in the wash. Four ways an order gets here: a customer paying
   * their quote by QRIS, two counter orders paid on the spot, and one an admin
   * had to confirm by hand because the callback never arrived.
   */
  {
    shows: 'Paid by QRIS after inspection, now being washed',
    customer: 'fajar',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.IN_CLEANING,
    createdHoursAgo: 34,
    pickupInDays: -1,
    items: [RUNNER, TOTE],
    steps: [...pickedUp('bagas'), ...inspected('dewi')],
    payments: [{ method: PaymentMethod.QRIS, status: TransactionStatus.PAID, hoursAfter: 22 }],
  },
  {
    shows: 'Paid and in the wash, for the tour account',
    customer: 'andi',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.IN_CLEANING,
    createdHoursAgo: 38,
    pickupInDays: -1,
    items: [SUEDE],
    steps: [...pickedUp('yoga'), ...inspected('dewi')],
    payments: [{ method: PaymentMethod.QRIS, status: TransactionStatus.PAID, hoursAfter: 22 }],
  },
  {
    shows: 'Counter order from a stranger, paid cash with change',
    guest: { name: 'Rizal Firmansyah', phone: '081500000001' },
    type: OrderType.OFFLINE,
    status: OrderStatus.IN_CLEANING,
    createdHoursAgo: 6,
    items: [SNEAKER],
    steps: [
      {
        name: ActionName.OFFLINE_ORDER,
        staff: 'dewi',
        hoursAfter: 0,
        note: 'Diantar langsung ke toko, pelanggan menunggu di tempat.',
      },
    ],
    payments: [
      { method: PaymentMethod.CASH, status: TransactionStatus.PAID, hoursAfter: 0, cash: 'change' },
    ],
  },
  {
    shows: 'Counter order for a registered customer, delivered back, paid by debit',
    customer: 'nadia',
    address: 'active',
    type: OrderType.WALK_IN_DELIVERY,
    status: OrderStatus.IN_CLEANING,
    createdHoursAgo: 9,
    items: [FADED, HELMET],
    steps: [
      {
        name: ActionName.OFFLINE_ORDER,
        staff: 'yoga',
        hoursAfter: 0,
        note: 'Minta diantar ke rumah setelah selesai.',
      },
    ],
    payments: [{ method: PaymentMethod.DEBIT, status: TransactionStatus.PAID, hoursAfter: 0 }],
  },
  {
    shows: 'Payment confirmed by hand after a lost callback',
    customer: 'lina',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.IN_CLEANING,
    createdHoursAgo: 50,
    pickupInDays: -2,
    items: [SCHOOL_SHOES],
    steps: [
      ...pickedUp('yoga'),
      ...inspected('yoga'),
      {
        name: ActionName.PAYMENT_OVERRIDE,
        staff: 'sari',
        hoursAfter: 44,
        note: 'Bukti transfer diterima pelanggan via WhatsApp, callback Midtrans tidak masuk.',
      },
    ],
    payments: [{ method: PaymentMethod.CASH, status: TransactionStatus.PAID, hoursAfter: 44 }],
  },

  /**
   * Washed, paid for, and sitting on the shelf. Only orders with nowhere to be
   * delivered reach this status, so this is the counter's own list.
   */
  {
    shows: 'On the shelf, customer already told it is ready',
    customer: 'hendra',
    type: OrderType.OFFLINE,
    status: OrderStatus.CLEANING_DONE,
    createdHoursAgo: 30,
    items: [SUEDE],
    steps: [
      { name: ActionName.OFFLINE_ORDER, staff: 'bagas', hoursAfter: 0 },
      { name: ActionName.CLEANING_DONE, staff: 'dewi', hoursAfter: 26 },
      { name: ActionName.READY_NOTICE_SENT, staff: 'dewi', hoursAfter: 27 },
    ],
    payments: [{ method: PaymentMethod.QRIS, status: TransactionStatus.PAID, hoursAfter: 0 }],
  },
  {
    shows: 'On the shelf, nobody has been told yet',
    guest: { name: 'Putri Anggraini', phone: '081500000002' },
    type: OrderType.OFFLINE,
    status: OrderStatus.CLEANING_DONE,
    createdHoursAgo: 22,
    items: [TOTE],
    steps: [
      { name: ActionName.OFFLINE_ORDER, staff: 'yoga', hoursAfter: 0 },
      { name: ActionName.CLEANING_DONE, staff: 'bagas', hoursAfter: 20 },
    ],
    payments: [{ method: PaymentMethod.DEBIT, status: TransactionStatus.PAID, hoursAfter: 0 }],
  },
  {
    /**
     * The tour account brought these in themselves rather than booking a
     * pickup, which is the only way a customer with an address ends up with an
     * order waiting on the shelf instead of being driven back to them.
     */
    shows: 'On the shelf, for the tour account',
    customer: 'andi',
    type: OrderType.OFFLINE,
    status: OrderStatus.CLEANING_DONE,
    createdHoursAgo: 27,
    items: [RUNNER],
    steps: [
      { name: ActionName.OFFLINE_ORDER, staff: 'bagas', hoursAfter: 0 },
      { name: ActionName.CLEANING_DONE, staff: 'ilham', hoursAfter: 24 },
    ],
    payments: [
      { method: PaymentMethod.CASH, status: TransactionStatus.PAID, hoursAfter: 0, cash: 'change' },
    ],
  },

  /**
   * Washed and on its way back. One free in the trip queue, one in somebody's
   * hands right now.
   */
  {
    shows: 'Out for delivery, free after an earlier claim was released',
    customer: 'andi',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.IN_DELIVERY,
    createdHoursAgo: 60,
    pickupInDays: -2,
    items: [SNEAKER],
    steps: [
      ...pickedUp('bagas'),
      ...inspected('dewi'),
      ...washed('dewi'),
      { name: ActionName.ATTEMPT_DELIVERY, staff: 'yoga', hoursAfter: 56 },
      { name: ActionName.RELEASE_DELIVERY, staff: 'yoga', hoursAfter: 57 },
    ],
    payments: [{ method: PaymentMethod.QRIS, status: TransactionStatus.PAID, hoursAfter: 22 }],
  },
  {
    shows: 'Delivery claimed right now — locked to a staff member',
    customer: 'siti',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.IN_DELIVERY,
    createdHoursAgo: 58,
    pickupInDays: -2,
    items: [HELMET, RUNNER],
    steps: [
      ...pickedUp('yoga'),
      ...inspected('yoga'),
      ...washed('bagas'),
      { name: ActionName.ATTEMPT_DELIVERY, staff: 'yoga', hoursAfter: 57 },
    ],
    lock: { staff: 'yoga', task: ActionName.DELIVERY, expiresInHours: 3 },
    payments: [{ method: PaymentMethod.QRIS, status: TransactionStatus.PAID, hoursAfter: 22 }],
  },

  /**
   * Finished, spread back across the last month so the revenue trend, the
   * thirty-day report and the type split all have history to draw.
   */
  {
    shows: 'Finished online order, delivered to the door',
    customer: 'budi',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.COMPLETED,
    createdHoursAgo: 3 * HOURS_PER_DAY,
    pickupInDays: -3,
    items: [SNEAKER, RUNNER],
    steps: [...pickedUp('bagas'), ...inspected('dewi'), ...washed('dewi'), ...delivered('bagas')],
    payments: [{ method: PaymentMethod.QRIS, status: TransactionStatus.PAID, hoursAfter: 21 }],
  },
  {
    shows: 'Finished and receipted, for the tour account',
    customer: 'andi',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.COMPLETED,
    createdHoursAgo: 11 * HOURS_PER_DAY,
    pickupInDays: -11,
    items: [BOOT, TOTE],
    steps: [...pickedUp('putra'), ...inspected('dewi'), ...washed('ilham'), ...delivered('putra')],
    payments: [{ method: PaymentMethod.QRIS, status: TransactionStatus.PAID, hoursAfter: 21 }],
  },
  {
    shows: 'Finished counter order, collected at the shop',
    guest: { name: 'Galih Pratama', phone: '081500000003' },
    type: OrderType.OFFLINE,
    status: OrderStatus.COMPLETED,
    createdHoursAgo: 4 * HOURS_PER_DAY,
    items: [SCHOOL_SHOES],
    steps: [
      { name: ActionName.OFFLINE_ORDER, staff: 'dewi', hoursAfter: 0 },
      { name: ActionName.CLEANING_DONE, staff: 'bagas', hoursAfter: 20 },
      { name: ActionName.COLLECTED, staff: 'dewi', hoursAfter: 27 },
    ],
    payments: [
      { method: PaymentMethod.CASH, status: TransactionStatus.PAID, hoursAfter: 0, cash: 'exact' },
    ],
  },
  {
    shows: 'Finished counter order that was delivered back',
    customer: 'maya',
    address: 'active',
    type: OrderType.WALK_IN_DELIVERY,
    status: OrderStatus.COMPLETED,
    createdHoursAgo: 6 * HOURS_PER_DAY,
    items: [BOOT],
    steps: [
      { name: ActionName.OFFLINE_ORDER, staff: 'yoga', hoursAfter: 0 },
      { name: ActionName.CLEANING_DONE, staff: 'dewi', hoursAfter: 22 },
      { name: ActionName.ATTEMPT_DELIVERY, staff: 'bagas', hoursAfter: 26 },
      { name: ActionName.DELIVERY, staff: 'bagas', hoursAfter: 27 },
    ],
    payments: [{ method: PaymentMethod.DEBIT, status: TransactionStatus.PAID, hoursAfter: 0 }],
  },
  {
    shows: 'Finished order at the address the customer has since replaced',
    customer: 'nadia',
    address: 'retired',
    type: OrderType.ONLINE,
    status: OrderStatus.COMPLETED,
    createdHoursAgo: 9 * HOURS_PER_DAY,
    pickupInDays: -9,
    items: [TOTE, HELMET],
    steps: [...pickedUp('yoga'), ...inspected('yoga'), ...washed('bagas'), ...delivered('yoga')],
    payments: [{ method: PaymentMethod.QRIS, status: TransactionStatus.PAID, hoursAfter: 22 }],
  },
  {
    shows: 'Finished order belonging to a deactivated account',
    customer: 'lina',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.COMPLETED,
    createdHoursAgo: 13 * HOURS_PER_DAY,
    pickupInDays: -13,
    items: [FADED],
    steps: [...pickedUp('rina'), ...inspected('rina'), ...washed('rina'), ...delivered('bagas')],
    payments: [{ method: PaymentMethod.QRIS, status: TransactionStatus.PAID, hoursAfter: 21 }],
  },
  {
    shows: 'Finished order recorded by a staff member who has since left',
    guest: { name: 'Wahyu Setiawan', phone: '081500000004' },
    type: OrderType.OFFLINE,
    status: OrderStatus.COMPLETED,
    createdHoursAgo: 17 * HOURS_PER_DAY,
    items: [SUEDE, SNEAKER],
    steps: [
      { name: ActionName.OFFLINE_ORDER, staff: 'rina', hoursAfter: 0 },
      { name: ActionName.CLEANING_DONE, staff: 'rina', hoursAfter: 24 },
      { name: ActionName.COLLECTED, staff: 'bagas', hoursAfter: 30 },
    ],
    payments: [
      { method: PaymentMethod.CASH, status: TransactionStatus.PAID, hoursAfter: 0, cash: 'change' },
    ],
  },
  {
    shows: 'Finished online order from three weeks back',
    customer: 'fajar',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.COMPLETED,
    createdHoursAgo: 21 * HOURS_PER_DAY,
    pickupInDays: -21,
    items: [RUNNER, SCHOOL_SHOES],
    steps: [...pickedUp('bagas'), ...inspected('dewi'), ...washed('dewi'), ...delivered('bagas')],
    payments: [{ method: PaymentMethod.QRIS, status: TransactionStatus.PAID, hoursAfter: 20 }],
  },
  {
    shows: 'Finished counter order from four weeks back',
    guest: { name: 'Intan Permatasari', phone: '081500000005' },
    type: OrderType.OFFLINE,
    status: OrderStatus.COMPLETED,
    createdHoursAgo: 27 * HOURS_PER_DAY,
    items: [HELMET],
    steps: [
      { name: ActionName.OFFLINE_ORDER, staff: 'bagas', hoursAfter: 0 },
      { name: ActionName.CLEANING_DONE, staff: 'yoga', hoursAfter: 21 },
      { name: ActionName.COLLECTED, staff: 'bagas', hoursAfter: 26 },
    ],
    payments: [
      { method: PaymentMethod.CASH, status: TransactionStatus.PAID, hoursAfter: 0, cash: 'exact' },
    ],
  },

  /**
   * Called off before anyone drove anywhere — the only point in the lifecycle
   * where a customer may still cancel, and so the only place this status can
   * come from.
   */
  {
    shows: 'Cancelled by the customer before pickup day',
    customer: 'siti',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.CANCELLED,
    createdHoursAgo: 5 * HOURS_PER_DAY,
    pickupInDays: -4,
  },
  {
    shows: 'Cancelled booking from a fortnight ago',
    customer: 'andi',
    address: 'active',
    type: OrderType.ONLINE,
    status: OrderStatus.CANCELLED,
    createdHoursAgo: 15 * HOURS_PER_DAY,
    pickupInDays: -14,
  },
]

/**
 * How long a proof photo's signed URL stays valid, matched to how long the
 * files themselves are kept.
 */
const PHOTO_RETENTION = '90d'

/**
 * Which storage folder each photographed action files its proof under, mirrored
 * from `TaskService`. An action that is not in here is one that is recorded
 * without a photo — claiming a task, releasing it, sending a message.
 */
const PHOTO_FOLDER: Partial<Record<ActionName, string>> = {
  [ActionName.PICKUP]: 'pickup',
  [ActionName.DELIVERY]: 'delivery',
  [ActionName.INSPECTION]: 'inspection',
  [ActionName.CLEANING_DONE]: 'cleaning',
  [ActionName.OFFLINE_ORDER]: 'offline',
}

/**
 * The colour each kind of proof photo is drawn in, so the before/after strip
 * on the order page shows two distinguishable images rather than one repeated
 * grey square.
 */
const PHOTO_TINT: Record<string, [number, number, number]> = {
  pickup: [37, 99, 235],
  delivery: [22, 163, 74],
  inspection: [217, 119, 6],
  cleaning: [147, 51, 234],
  offline: [220, 38, 38],
}

const ITEM_TYPE_BY_CATEGORY: Record<string, string> = {
  [ServiceCategory.SHOE_WASH]: ItemType.SHOE,
  [ServiceCategory.SHOE_REPAIR]: ItemType.SHOE,
  [ServiceCategory.BAG_WASH]: ItemType.BAG,
  [ServiceCategory.HELMET_WASH]: ItemType.HELMET,
}

/* -------------------------------------------------------------------------- */
/*  Placeholder images                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Proof photos and QR codes are real files on the drive disk rather than
 * invented URLs, because the pages that show them are half of what there is to
 * demonstrate: the before/after comparison on the order page, the photo strip
 * in the audit trail, the QR code on the payment screen. A path pointing at
 * nothing renders as a broken image and reads as a broken feature.
 *
 * They are drawn here rather than shipped as fixtures so the repository does
 * not carry a folder of binary sample images around for one seeder's sake.
 */
const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let code = index

  for (let bit = 0; bit < 8; bit++) {
    code = code & 1 ? 0xedb88320 ^ (code >>> 1) : code >>> 1
  }

  return code >>> 0
})

function crc32(data: Buffer): number {
  let crc = 0xffffffff

  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, body: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(body.length)

  const typed = Buffer.concat([Buffer.from(type, 'ascii'), body])

  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(typed))

  return Buffer.concat([length, typed, checksum])
}

/**
 * Encodes a truecolour PNG from a function that answers what colour each pixel
 * is. Uncompressed rows with no filter, which zlib flattens to almost nothing
 * for images this flat.
 */
function png(
  width: number,
  height: number,
  pixel: (x: number, y: number) => [number, number, number]
): Buffer {
  const stride = width * 3 + 1
  const raw = Buffer.alloc(stride * height)

  for (let y = 0; y < height; y++) {
    const row = y * stride

    for (let x = 0; x < width; x++) {
      const [red, green, blue] = pixel(x, y)
      raw[row + 1 + x * 3] = red
      raw[row + 2 + x * 3] = green
      raw[row + 3 + x * 3] = blue
    }
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // bits per channel
  header[9] = 2 // truecolour

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * A tinted card with a lighter band across it — enough for a thumbnail strip
 * to read as a set of distinct photos without pretending to be one.
 */
function proofPng([red, green, blue]: [number, number, number]): Buffer {
  const mix = (channel: number, light: number) =>
    Math.round(channel + (255 - channel) * Math.min(Math.max(light, 0), 1))

  return png(480, 270, (x, y) => {
    const depth = (x / 480 + y / 270) / 2
    const band = Math.abs(y - 150) < 34 ? 0.3 : 0
    const light = 0.35 + depth * 0.35 + band

    return [mix(red, light), mix(green, light), mix(blue, light)]
  })
}

/**
 * A QR-shaped placeholder: the three finder squares a scanner looks for, and a
 * field of modules derived from the order number so two orders never show the
 * same code. It does not decode to anything, and it is not meant to — the
 * demo has no Midtrans charge behind it.
 */
function qrPng(seed: string): Buffer {
  const modules = 25
  const quiet = 4
  const scale = 8
  const size = (modules + quiet * 2) * scale

  let state = 0
  for (const character of seed) {
    state = (state * 31 + character.charCodeAt(0)) >>> 0
  }

  const filled: boolean[][] = Array.from({ length: modules }, () => Array(modules).fill(false))

  const isFinder = (column: number, row: number) => {
    const inSquare = (originX: number, originY: number) => {
      const x = column - originX
      const y = row - originY

      if (x < 0 || y < 0 || x > 6 || y > 6) {
        return null
      }

      const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3))

      return ring !== 2
    }

    return inSquare(0, 0) ?? inSquare(modules - 7, 0) ?? inSquare(0, modules - 7)
  }

  for (let row = 0; row < modules; row++) {
    for (let column = 0; column < modules; column++) {
      const finder = isFinder(column, row)

      if (finder !== null) {
        filled[row][column] = finder
        continue
      }

      state = (state * 1664525 + 1013904223) >>> 0
      filled[row][column] = state % 100 < 45
    }
  }

  return png(size, size, (x, y) => {
    const column = Math.floor(x / scale) - quiet
    const row = Math.floor(y / scale) - quiet
    const dark = column >= 0 && row >= 0 && column < modules && row < modules && filled[row][column]

    return dark ? [17, 17, 17] : [255, 255, 255]
  })
}

async function storeImage(folder: string, contents: Buffer): Promise<string> {
  const key = `${folder}/${randomUUID()}.png`

  await drive.use().put(key, contents)

  return drive.use().getSignedUrl(key, { expiresIn: PHOTO_RETENTION })
}

/* -------------------------------------------------------------------------- */
/*  Seeder                                                                     */
/* -------------------------------------------------------------------------- */

export default class extends BaseSeeder {
  /**
   * Demo data belongs in a demo database. Anywhere else this is a seeder that
   * invents two dozen orders nobody placed and revenue nobody paid.
   */
  static environment = ['development']

  private users = new Map<string, User>()
  private addresses = new Map<string, Address>()
  private services = new Map<string, Service>()
  private sequences = new Map<string, number>()

  async run() {
    /**
     * Matched on the first demo staff account. Re-running would not top the
     * data up, it would double it — a second copy of every order under new
     * numbers — so this refuses instead and says how to start over.
     */
    if (await User.findBy('phone', STAFF[0].phone)) {
      logger.info(
        'Demo data is already loaded. Run "node ace migration:fresh --seed" to rebuild it.'
      )

      return
    }

    /**
     * Seeders run in alphabetical order, so these two would otherwise run
     * after this one and the catalogue would not exist yet to price anything
     * against. Both are idempotent, so calling them here costs nothing when
     * they run again on their own.
     */
    await new ServiceSeeder(this.client).run()
    await new UserSeeder(this.client).run()

    /**
     * A signed photo URL is built from the route the drive provider registers
     * for the local disk, and the router only resolves route names once its
     * routes are committed — which normally happens as the HTTP server boots
     * and therefore never during an ace command.
     */
    router.commit()

    for (const service of await Service.all()) {
      this.services.set(service.name, service)
    }

    await this.createAccounts()
    await this.createOrders()

    this.report()
  }

  /**
   * Creates every account and the addresses that belong to them.
   */
  private async createAccounts(): Promise<void> {
    const now = DateTime.now()

    for (const admin of ADMINS) {
      this.users.set(
        admin.key,
        await User.create({
          name: admin.name,
          phone: admin.phone,
          password: DEMO_PASSWORD,
          role: Role.ADMIN,
          isActive: admin.isActive,
          createdAt: now.minus({ days: 120 }),
        })
      )
    }

    for (const staff of STAFF) {
      this.users.set(
        staff.key,
        await User.create({
          name: staff.name,
          phone: staff.phone,
          password: DEMO_PASSWORD,
          role: Role.STAFF,
          isActive: staff.isActive,
          createdAt: now.minus({ days: 90 }),
        })
      )
    }

    for (const [index, customer] of CUSTOMERS.entries()) {
      const user = await User.create({
        name: customer.name,
        phone: customer.phone,
        password: DEMO_PASSWORD,
        role: Role.CUSTOMER,
        isActive: customer.isActive,
        createdAt: now.minus({ days: 60 - index * 5 }),
      })

      this.users.set(customer.key, user)

      /**
       * The retired one is written first so the active address is the newer
       * row, which is the order they would have been created in for real.
       */
      if (customer.retiredAddress) {
        this.addresses.set(
          `${customer.key}:retired`,
          await this.createAddress(user, customer.retiredAddress, false, now.minus({ days: 45 }))
        )
      }

      if (customer.address) {
        this.addresses.set(
          `${customer.key}:active`,
          await this.createAddress(user, customer.address, true, now.minus({ days: 30 }))
        )
      }
    }
  }

  private async createAddress(
    user: User,
    address: DemoAddress,
    isActive: boolean,
    createdAt: DateTime
  ): Promise<Address> {
    return Address.create({
      userId: user.id,
      name: user.name,
      phone: user.phone,
      street: address.street,
      latitude: address.latitude,
      longitude: address.longitude,
      note: address.note,
      isActive,
      createdAt,
      updatedAt: createdAt,
    })
  }

  /**
   * Writes every blueprint, oldest first, so the order numbers run in the same
   * direction as the clock the way they would have in real trading.
   */
  private async createOrders(): Promise<void> {
    const chronological = [...ORDERS].sort((a, b) => b.createdHoursAgo - a.createdHoursAgo)

    for (const blueprint of chronological) {
      await this.createOrder(blueprint)
    }
  }

  private async createOrder(blueprint: Blueprint): Promise<void> {
    const createdAt = DateTime.now().minus({ hours: blueprint.createdHoursAgo })
    const customer = blueprint.customer ? this.users.get(blueprint.customer)! : null
    const address = blueprint.address
      ? this.addresses.get(`${blueprint.customer}:${blueprint.address}`)!
      : null

    /**
     * Who staff should ask for at the door. For a booked order that is
     * whoever the pickup address names — a customer may well be booking for
     * somebody else — and for a counter order it is whoever is standing there.
     */
    const contact = address
      ? { name: address.name, phone: address.phone }
      : customer
        ? { name: customer.name, phone: customer.phone }
        : blueprint.guest!

    const order = await Order.create({
      userId: customer?.id ?? null,
      addressId: address?.id ?? null,
      customerName: contact.name,
      customerPhone: contact.phone,
      orderNumber: this.nextOrderNumber(createdAt),
      status: blueprint.status,
      type: blueprint.type,
      pickupDate:
        blueprint.pickupInDays === undefined
          ? null
          : DateTime.now().startOf('day').plus({ days: blueprint.pickupInDays }),
      totalPrice: null,
      createdAt,
      updatedAt: createdAt,
      ...(blueprint.lock
        ? {
            lockedById: this.users.get(blueprint.lock.staff)!.id,
            lockedTask: blueprint.lock.task,
            lockedUntil: DateTime.now().plus({ hours: blueprint.lock.expiresInHours }),
          }
        : {}),
    })

    const totalPrice = await this.createItems(order, blueprint.items ?? [], createdAt)

    if (totalPrice > 0) {
      await order.merge({ totalPrice }).save()
    }

    await this.createSteps(order, blueprint.steps ?? [], createdAt)
    await this.createPayments(order, blueprint.payments ?? [], createdAt, totalPrice)
  }

  /**
   * Order numbers restart daily and count up within the day, the same shape
   * `OrderService` issues them in.
   */
  private nextOrderNumber(createdAt: DateTime): string {
    const prefix = `ORD${createdAt.toFormat('yyLLdd')}`
    const sequence = (this.sequences.get(prefix) ?? 0) + 1

    this.sequences.set(prefix, sequence)

    return `${prefix}-${String(sequence).padStart(3, '0')}`
  }

  /**
   * Creates the physical items and one priced line per service, exactly as an
   * inspection or a counter order does, and returns what the order comes to.
   */
  private async createItems(order: Order, lines: Line[], createdAt: DateTime): Promise<number> {
    let totalPrice = 0

    for (const line of lines) {
      const service = this.service(line.service)

      const item = await Item.create({
        type: ITEM_TYPE_BY_CATEGORY[service.category] ?? ItemType.SHOE,
        brand: line.brand,
        model: line.model,
        material: line.material,
        size: line.size,
        condition: line.condition,
        note: line.note ?? null,
        createdAt,
        updatedAt: createdAt,
      })

      for (const name of [line.service, ...(line.additional ?? [])]) {
        const priced = this.service(name)
        const price = Number(priced.price)

        await OrderItem.create({
          orderId: order.id,
          itemId: item.id,
          serviceId: priced.id,
          name: `${priced.name} - ${item.brand} ${item.model}`,
          price,
          subtotal: price,
          createdAt,
          updatedAt: createdAt,
        })

        totalPrice += price
      }
    }

    return totalPrice
  }

  /**
   * Writes the audit trail, storing a placeholder proof photo for the actions
   * that are completed by taking one.
   */
  private async createSteps(order: Order, steps: Step[], createdAt: DateTime): Promise<void> {
    for (const step of steps) {
      const folder = PHOTO_FOLDER[step.name]
      const recordedAt = createdAt.plus({ hours: step.hoursAfter })

      await OrderAction.create({
        orderId: order.id,
        staffId: this.users.get(step.staff)!.id,
        name: step.name,
        photoPath: folder ? await storeImage(folder, proofPng(PHOTO_TINT[folder])) : null,
        note: step.note ?? null,
        createdAt: recordedAt,
        updatedAt: recordedAt,
      })
    }
  }

  /**
   * Writes the payment attempts. A QRIS charge carries the Midtrans
   * identifiers and a scannable-looking code, the two counter methods carry
   * neither, and only cash records what was actually handed over.
   */
  private async createPayments(
    order: Order,
    payments: Payment[],
    createdAt: DateTime,
    totalPrice: number
  ): Promise<void> {
    for (const payment of payments) {
      const chargedAt = createdAt.plus({ hours: payment.hoursAfter })
      const isQris = payment.method === PaymentMethod.QRIS

      await Transaction.create({
        orderId: order.id,
        paymentMethod: payment.method,
        status: payment.status,
        midtransOrderId: isQris ? `${order.orderNumber}-${chargedAt.toMillis()}` : null,
        midtransTransactionId: isQris ? randomUUID() : null,
        qrCode: isQris ? await storeImage('qris', qrPng(order.orderNumber)) : null,
        cashReceived: this.cashReceived(payment, totalPrice),
        createdAt: chargedAt,
        updatedAt: chargedAt,
      })
    }
  }

  /**
   * What the customer put on the counter: the exact amount, or the round note
   * that leaves the shop with change to give back.
   */
  private cashReceived(payment: Payment, totalPrice: number): number | null {
    if (payment.method !== PaymentMethod.CASH || !payment.cash) {
      return null
    }

    if (payment.cash === 'exact') {
      return totalPrice
    }

    return Math.ceil((totalPrice + 1) / 50000) * 50000
  }

  private service(name: string): Service {
    const service = this.services.get(name)

    if (!service) {
      throw new Error(`Demo seeder refers to a service that is not in the catalogue: "${name}"`)
    }

    return service
  }

  /**
   * Prints the accounts to sign in with, because a demo database nobody has
   * the password to is not a demo.
   */
  private report(): void {
    /**
     * Whose sign-in lands on a claimed task rather than on the queue, worked
     * out from the blueprints themselves so the two can never drift apart.
     */
    const holding = new Map(
      ORDERS.filter((order) => order.lock).map((order) => [order.lock!.staff, order.lock!.task])
    )

    /**
     * How much of the lifecycle each customer's own order list covers, counted
     * the same way so the account described as showing every status is
     * whichever one actually does.
     */
    const owned = new Map<string, Blueprint[]>()

    for (const order of ORDERS) {
      if (order.customer) {
        owned.set(order.customer, [...(owned.get(order.customer) ?? []), order])
      }
    }

    const lifecycle = Object.keys(OrderStatus).length
    const covers = (key: string) =>
      new Set((owned.get(key) ?? []).map((order) => order.status)).size

    const row = (role: string, phone: string, name: string, aside = '') =>
      `  ${role.padEnd(8)} ${phone}  ${name.padEnd(18)} ${aside}`

    const lines = [
      `Demo data loaded: ${ORDERS.length} orders across every status, ${this.users.size + 1} accounts.`,
      `Sign in with any of these — the password is "${DEMO_PASSWORD}":`,
      row('Admin', '081200000001', 'Admin UmimaClean', 'password "admin12345"'),
      ...ADMINS.map((admin) => row('Admin', admin.phone, admin.name)),
      ...STAFF.map((staff) =>
        row(
          'Staff',
          staff.phone,
          staff.name,
          staff.isActive
            ? holding.has(staff.key)
              ? `already holding a claimed ${holding.get(staff.key)}`
              : 'free — starts on the trip queue'
            : 'deactivated, cannot sign in'
        )
      ),
      ...CUSTOMERS.map((customer) =>
        row(
          'Customer',
          customer.phone,
          customer.name,
          customer.isActive
            ? covers(customer.key) === lifecycle
              ? 'one order in every status — start here'
              : customer.address
                ? `${(owned.get(customer.key) ?? []).length} orders of their own`
                : 'no address yet'
            : 'deactivated, cannot sign in'
        )
      ),
    ]

    logger.info(lines.join('\n'))
  }
}

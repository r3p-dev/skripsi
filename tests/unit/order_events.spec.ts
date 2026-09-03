import { test } from '@japa/runner'
import AddressService from '#services/address_service'
import CatalogueService from '#services/catalogue_service'
import OrderCreated from '#events/order_created'
import OrderPaid from '#events/order_paid'
import OrderPriceCorrected from '#events/order_price_corrected'
import OrderService, { ADMIN_ORDERS_CHANNEL } from '#services/order_service'
import OrderStatusChanged from '#events/order_status_changed'
import RoutingService from '#services/routing_service'
import TaskService from '#services/task_service'
import TransactionService from '#services/transaction_service'
import emitter from '@adonisjs/core/services/emitter'
import testUtils from '@adonisjs/core/services/test_utils'
import { ItemType } from '#enums/item_enum'
import { OrderStatus } from '#enums/order_enum'
import { PaymentMethod } from '#enums/transaction_enum'
import { UserFactory } from '#database/factories/user_factory'
import { recordBroadcasts, stubOrderActionFailure } from '#tests/utils/fakes'
import { createCustomer, createOrder } from '#tests/utils/helpers'
import { DateTime } from 'luxon'

const orderService = new OrderService(new AddressService())

const taskService = new TaskService(
  new AddressService(),
  new CatalogueService(),
  orderService,
  new RoutingService()
)

const transactionService = new TransactionService(orderService)

const LIFECYCLE_EVENTS = {
  OrderCreated,
  OrderStatusChanged,
  OrderPaid,
  OrderPriceCorrected,
} as const

type LifecycleEvent = keyof typeof LIFECYCLE_EVENTS

type Recorder = {
  names: LifecycleEvent[]
  of<Name extends LifecycleEvent>(name: Name): InstanceType<(typeof LIFECYCLE_EVENTS)[Name]>[]
  restore(): void
}

/**
 * Listens for every lifecycle event, so a test can assert on what the services
 * announced rather than on what any one listener happened to do with it.
 */
function recordEvents(): Recorder {
  const seen: { name: LifecycleEvent; event: unknown }[] = []

  const unsubscribes = Object.entries(LIFECYCLE_EVENTS).map(([name, Event]) =>
    emitter.on(Event, (event) => {
      seen.push({ name: name as LifecycleEvent, event })
    })
  )

  return {
    get names() {
      return seen.map((entry) => entry.name)
    },
    of<Name extends LifecycleEvent>(name: Name) {
      return seen
        .filter((entry) => entry.name === name)
        .map((entry) => entry.event) as InstanceType<(typeof LIFECYCLE_EVENTS)[Name]>[]
    },
    restore() {
      unsubscribes.forEach((unsubscribe) => unsubscribe())
    },
  }
}

function fakePhoto() {
  return { extname: 'jpg', async moveToDisk() {} } as never
}

test.group('Order lifecycle events | what the services announce', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('booking an order announces it once', async ({ assert }) => {
    const customer = await createCustomer()
    const events = recordEvents()

    try {
      await orderService.createOnlineOrder(customer.user, {
        pickupDate: DateTime.now().plus({ days: 1 }),
        items: [
          {
            type: ItemType.SHOE,
            brand: 'Nike',
            model: 'Air Force 1',
            size: '42',
            material: 'Kanvas',
            note: undefined,
          },
        ],
      } as never)
    } finally {
      events.restore()
    }

    assert.deepEqual(events.names, ['OrderCreated'])
  })

  test('a stage change carries where the order came from and where it went', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const events = recordEvents()

    try {
      await orderService.transitionTo(order, OrderStatus.IN_PICKUP)
    } finally {
      events.restore()
    }

    const [changed] = events.of('OrderStatusChanged')

    assert.equal(changed.order.orderNumber, order.orderNumber)
    assert.equal(changed.from, OrderStatus.PICKUP_SCHEDULED)
    assert.equal(changed.to, OrderStatus.IN_PICKUP)
    assert.equal(changed.reason, 'status-change')
  })

  test('a payment is both a stage change and a payment, announced once', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice: '150000' },
    })

    const events = recordEvents()
    const broadcasts = recordBroadcasts()

    try {
      await transactionService.confirmManualPayment(order, PaymentMethod.CASH, 'Tunai di kasir')
    } finally {
      broadcasts.restore()
      events.restore()
    }

    const [changed] = events.of('OrderStatusChanged')

    assert.equal(changed.to, OrderStatus.IN_CLEANING)
    assert.equal(changed.reason, 'payment')
    assert.lengthOf(events.of('OrderPaid'), 1)

    const sent = broadcasts.on(ADMIN_ORDERS_CHANNEL)

    assert.lengthOf(sent, 1, 'the feed hears about the moment once')
    assert.equal(sent[0].event, 'order:paid')
  })

  test('a customer collecting their order is a stage change like any other', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.CLEANING_DONE },
    })

    const staff = await UserFactory.apply('staff').create()
    const events = recordEvents()

    try {
      await taskService.completeCollection(staff, order, fakePhoto())
    } finally {
      events.restore()
    }

    assert.deepEqual(events.names, ['OrderStatusChanged'])

    const [changed] = events.of('OrderStatusChanged')

    assert.equal(changed.from, OrderStatus.CLEANING_DONE)
    assert.equal(changed.to, OrderStatus.COMPLETED)
  })

  test('a re-pricing is announced apart from a stage change', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice: '90000' },
    })

    const events = recordEvents()

    try {
      await taskService.updateOrderItems(order, { items: [] } as never)
    } finally {
      events.restore()
    }

    assert.deepEqual(events.names, ['OrderPriceCorrected'])
  })

  test('work that never commits announces nothing', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { states: ['inCleaning'], itemCount: 1 })
    const staff = await UserFactory.apply('staff').create()
    const restoreFailure = stubOrderActionFailure()
    const events = recordEvents()

    try {
      await assert.rejects(() => taskService.completeCleaning(staff, order, fakePhoto()))
    } finally {
      events.restore()
      restoreFailure()
    }

    assert.isEmpty(events.names)
  })
})

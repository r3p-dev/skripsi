import { test } from '@japa/runner'
import AddressService from '#services/address_service'
import CatalogueService from '#services/catalogue_service'
import OrderService, { ADMIN_ORDERS_CHANNEL } from '#services/order_service'
import RoutingService from '#services/routing_service'
import TaskService from '#services/task_service'
import TransactionService from '#services/transaction_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { CatalogueFactory } from '#database/factories/catalogue_factory'
import { ItemType } from '#enums/item_enum'
import { OrderStatus } from '#enums/order_enum'
import { PaymentMethod } from '#enums/transaction_enum'
import { TaskType } from '#enums/task_enum'
import { UserFactory } from '#database/factories/user_factory'
import { recordBroadcasts, stubOrderActionFailure, stubOrderItemFailure } from '#tests/utils/fakes'
import { createCustomer, createOrder } from '#tests/utils/helpers'
import { formatRupiah } from '#utils/currency'
import { DateTime } from 'luxon'

const orderService = new OrderService(new AddressService())

const taskService = new TaskService(
  new AddressService(),
  new CatalogueService(),
  orderService,
  new RoutingService()
)

const transactionService = new TransactionService(orderService)

function staff() {
  return UserFactory.apply('staff').create()
}

function fakePhoto() {
  return { extname: 'jpg', async moveToDisk() {} } as never
}

function inspectedItem(catalogueId: number) {
  return {
    type: ItemType.SHOE,
    brand: 'Nike',
    model: 'Air Force 1',
    size: '42',
    material: 'Kanvas',
    condition: 'Kotor ringan',
    note: undefined,
    catalogue: catalogueId,
    additionalCatalogues: [],
  }
}

function counterOrder(catalogueId: number) {
  return {
    name: 'Budi Santoso',
    phone: '081234567890',
    items: [inspectedItem(catalogueId)],
    photo: fakePhoto(),
    note: undefined,
    paymentMethod: PaymentMethod.CASH,
    cashReceived: 500_000,
  } as never
}

test.group('Admin feed | the shop-wide channel', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a new online order is announced', async ({ assert }) => {
    const broadcasts = recordBroadcasts()
    const customer = await createCustomer()

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
      broadcasts.restore()
    }

    const sent = broadcasts.on(ADMIN_ORDERS_CHANNEL)

    assert.lengthOf(sent, 1)
    assert.equal(sent[0].event, 'order:created')
    assert.equal(sent[0].reason, 'created')
    assert.equal(sent[0].status, OrderStatus.PICKUP_SCHEDULED)
    assert.equal(sent[0].customerName, customer.address.name)
    assert.isString(sent[0].statusLabel)
    assert.isString(sent[0].typeLabel)
    assert.isNull(sent[0].totalPriceLabel)
  })

  test('a counter order is announced once, as a creation', async ({ assert }) => {
    const catalogue = await CatalogueFactory.merge({ price: '75000' }).create()
    const broadcasts = recordBroadcasts()

    try {
      await taskService.createOfflineOrder(await staff(), counterOrder(catalogue.id))
    } finally {
      broadcasts.restore()
    }

    const sent = broadcasts.on(ADMIN_ORDERS_CHANNEL)

    assert.lengthOf(sent, 1)
    assert.equal(sent[0].event, 'order:created')
    assert.equal(sent[0].reason, 'created')
    assert.equal(sent[0].totalPriceLabel, formatRupiah(75_000))
  })

  test('a status change is announced as an update', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const broadcasts = recordBroadcasts()

    try {
      await orderService.transitionTo(order, OrderStatus.IN_PICKUP)
    } finally {
      broadcasts.restore()
    }

    const sent = broadcasts.on(ADMIN_ORDERS_CHANNEL)

    assert.lengthOf(sent, 1)
    assert.equal(sent[0].event, 'order:updated')
    assert.equal(sent[0].reason, 'status-change')
    assert.equal(sent[0].status, OrderStatus.IN_PICKUP)
    assert.equal(sent[0].orderNumber, order.orderNumber)
  })

  test('a cancellation is announced', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const broadcasts = recordBroadcasts()

    try {
      await orderService.cancelOrder(customer.user, order.orderNumber)
    } finally {
      broadcasts.restore()
    }

    const sent = broadcasts.on(ADMIN_ORDERS_CHANNEL)

    assert.lengthOf(sent, 1)
    assert.equal(sent[0].status, OrderStatus.CANCELLED)
  })

  test('settling a bill is announced once, as a payment', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice: '150000' },
    })

    const broadcasts = recordBroadcasts()

    try {
      await transactionService.confirmManualPayment(
        order,
        PaymentMethod.DEBIT,
        'Bukti transfer sudah diterima'
      )
    } finally {
      broadcasts.restore()
    }

    const sent = broadcasts.on(ADMIN_ORDERS_CHANNEL)

    assert.lengthOf(sent, 1)
    assert.equal(sent[0].event, 'order:paid')
    assert.equal(sent[0].reason, 'payment')
    assert.equal(sent[0].status, OrderStatus.IN_CLEANING)
    assert.equal(sent[0].totalPriceLabel, formatRupiah(150_000))
  })

  test('the per-order channel is left untouched', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice: '150000' },
    })

    const broadcasts = recordBroadcasts()

    try {
      await transactionService.confirmManualPayment(order, PaymentMethod.DEBIT, 'Diterima')
    } finally {
      broadcasts.restore()
    }

    const perOrder = broadcasts.on(`orders/${order.orderNumber}`)

    assert.lengthOf(perOrder, 1)
    assert.equal(perOrder[0].orderStatus, OrderStatus.IN_CLEANING)
    assert.property(perOrder[0], 'transactionStatus')
  })

  test('a status change that never commits is not announced', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { states: ['inCleaning'], itemCount: 1 })
    const petugas = await staff()
    const restoreFailure = stubOrderActionFailure()
    const broadcasts = recordBroadcasts()

    try {
      await assert.rejects(() => taskService.completeCleaning(petugas, order, fakePhoto()))
    } finally {
      broadcasts.restore()
      restoreFailure()
    }

    assert.isEmpty(broadcasts.on(ADMIN_ORDERS_CHANNEL))
  })

  test('an inspection announces the price it just set', async ({ assert }) => {
    const catalogue = await CatalogueFactory.merge({ price: '90000' }).create()
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.IN_INSPECTION },
    })
    const petugas = await staff()

    await taskService.claim(petugas, order, TaskType.INSPECTION)

    const broadcasts = recordBroadcasts()

    try {
      await taskService.completeInspection(petugas, order, {
        photo: fakePhoto(),
        items: [
          {
            type: ItemType.SHOE,
            brand: 'Nike',
            model: 'Air Force 1',
            size: '42',
            material: 'Kanvas',
            condition: 'Kotor ringan',
            note: undefined,
            catalogue: catalogue.id,
            additionalCatalogues: [],
          },
        ],
      } as never)
    } finally {
      broadcasts.restore()
    }

    const sent = broadcasts.on(ADMIN_ORDERS_CHANNEL)

    assert.lengthOf(sent, 1)
    assert.equal(sent[0].event, 'order:updated')
    assert.equal(sent[0].reason, 'status-change')
    assert.equal(sent[0].status, OrderStatus.AWAITING_PAYMENT)
    assert.equal(sent[0].totalPriceLabel, formatRupiah(90_000))
  })

  test('a price correction is announced apart from a status change', async ({ assert }) => {
    const catalogue = await CatalogueFactory.merge({ price: '45000' }).create()
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice: '90000' },
    })

    const broadcasts = recordBroadcasts()

    try {
      await taskService.updateOrderItems(order, { items: [inspectedItem(catalogue.id)] } as never)
    } finally {
      broadcasts.restore()
    }

    const sent = broadcasts.on(ADMIN_ORDERS_CHANNEL)

    assert.lengthOf(sent, 1)
    assert.equal(sent[0].event, 'order:updated')
    assert.equal(sent[0].reason, 'price-correction')
    assert.equal(sent[0].status, OrderStatus.AWAITING_PAYMENT)
    assert.equal(sent[0].totalPriceLabel, formatRupiah(45_000))
  })

  test('a price correction that never commits is not announced', async ({ assert }) => {
    const catalogue = await CatalogueFactory.merge({ price: '45000' }).create()
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice: '90000' },
    })

    const restoreFailure = stubOrderItemFailure()
    const broadcasts = recordBroadcasts()

    try {
      await assert.rejects(() =>
        taskService.updateOrderItems(order, { items: [inspectedItem(catalogue.id)] } as never)
      )
    } finally {
      broadcasts.restore()
      restoreFailure()
    }

    assert.isEmpty(broadcasts.on(ADMIN_ORDERS_CHANNEL))
  })

  test('a trip that never commits is not announced', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const petugas = await staff()

    await taskService.claim(petugas, order, TaskType.PICKUP)

    const restoreFailure = stubOrderActionFailure()
    const broadcasts = recordBroadcasts()

    try {
      await assert.rejects(() =>
        taskService.completeTrip(petugas, order, TaskType.PICKUP, fakePhoto())
      )
    } finally {
      broadcasts.restore()
      restoreFailure()
    }

    assert.isEmpty(broadcasts.on(ADMIN_ORDERS_CHANNEL))
  })

  test('an inspection that never commits is not announced', async ({ assert }) => {
    const catalogue = await CatalogueFactory.create()
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.IN_INSPECTION },
    })
    const petugas = await staff()

    await taskService.claim(petugas, order, TaskType.INSPECTION)

    const restoreFailure = stubOrderActionFailure()
    const broadcasts = recordBroadcasts()

    try {
      await assert.rejects(() =>
        taskService.completeInspection(petugas, order, {
          photo: fakePhoto(),
          items: [inspectedItem(catalogue.id)],
        } as never)
      )
    } finally {
      broadcasts.restore()
      restoreFailure()
    }

    assert.isEmpty(broadcasts.on(ADMIN_ORDERS_CHANNEL))
  })

  test('a collection that never commits is not announced', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.CLEANING_DONE },
    })

    const petugas = await staff()
    const restoreFailure = stubOrderActionFailure()
    const broadcasts = recordBroadcasts()

    try {
      await assert.rejects(() => taskService.completeCollection(petugas, order, fakePhoto()))
    } finally {
      broadcasts.restore()
      restoreFailure()
    }

    assert.isEmpty(broadcasts.on(ADMIN_ORDERS_CHANNEL))
  })

  test('a counter order that never commits is not announced', async ({ assert }) => {
    const catalogue = await CatalogueFactory.create()
    const petugas = await staff()
    const restoreFailure = stubOrderActionFailure()
    const broadcasts = recordBroadcasts()

    try {
      await assert.rejects(() =>
        taskService.createOfflineOrder(petugas, counterOrder(catalogue.id))
      )
    } finally {
      broadcasts.restore()
      restoreFailure()
    }

    assert.isEmpty(broadcasts.on(ADMIN_ORDERS_CHANNEL))
  })

  test('a no-op transition says nothing', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const broadcasts = recordBroadcasts()

    try {
      await orderService.transitionTo(order, OrderStatus.PICKUP_SCHEDULED)
    } finally {
      broadcasts.restore()
    }

    assert.isEmpty(broadcasts.on(ADMIN_ORDERS_CHANNEL))
  })
})

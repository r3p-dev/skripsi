import { test } from '@japa/runner'
import AddressService from '#services/address_service'
import CatalogueService from '#services/catalogue_service'
import Item from '#models/item'
import OrderAction from '#models/order_action'
import OrderItem from '#models/order_item'
import OrderService from '#services/order_service'
import RoutingService from '#services/routing_service'
import TaskService from '#services/task_service'
import Transaction from '#models/transaction'
import testUtils from '@adonisjs/core/services/test_utils'
import { ActionName } from '#enums/order_action_enum'
import { CatalogueFactory } from '#database/factories/catalogue_factory'
import { ItemType } from '#enums/item_enum'
import { OrderStatus, OrderType } from '#enums/order_enum'
import { PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import { UserFactory } from '#database/factories/user_factory'
import { createCustomer, validationMessages } from '#tests/utils/helpers'

const taskService = new TaskService(
  new AddressService(),
  new CatalogueService(),
  new OrderService(new AddressService()),
  new RoutingService()
)

function staff() {
  return UserFactory.apply('staff').create()
}

function fakePhoto() {
  return { extname: 'jpg', async moveToDisk() {} } as never
}

function itemFor(catalogueId: number, extras: number[] = []) {
  return {
    type: ItemType.SHOE,
    brand: 'Nike',
    model: 'Air Force 1',
    size: '42',
    material: 'Kanvas',
    condition: 'Kotor ringan',
    note: undefined,
    catalogue: catalogueId,
    additionalCatalogues: extras,
  }
}

function counterOrder(catalogueId: number, overrides: Record<string, unknown> = {}) {
  return {
    name: 'Budi Santoso',
    phone: '081234567890',
    items: [itemFor(catalogueId)],
    photo: fakePhoto(),
    note: undefined,
    paymentMethod: PaymentMethod.CASH,
    cashReceived: 500_000,
    ...overrides,
  } as never
}

test.group('Counter orders | taking an order at the shop', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a walk-in without delivery is an offline order', async ({ assert }) => {
    const catalogue = await CatalogueFactory.create()

    const order = await taskService.createOfflineOrder(await staff(), counterOrder(catalogue.id))

    assert.equal(order.type, OrderType.OFFLINE)
    assert.isNull(order.addressId)
    assert.isNull(order.userId)
    assert.isNull(order.pickupDate)
  })

  test('the order skips inspection and payment and lands in the wash', async ({ assert }) => {
    const catalogue = await CatalogueFactory.create()

    const order = await taskService.createOfflineOrder(await staff(), counterOrder(catalogue.id))

    assert.equal(order.status, OrderStatus.IN_CLEANING)
  })

  test('the order is priced from the catalogue', async ({ assert }) => {
    const catalogue = await CatalogueFactory.merge({ price: '75000' }).create()

    const order = await taskService.createOfflineOrder(await staff(), counterOrder(catalogue.id))

    assert.equal(Number(order.totalPrice), 75_000)
  })

  test('add-on catalogues are added to the bill', async ({ assert }) => {
    const catalogue = await CatalogueFactory.merge({ price: '75000' }).create()
    const extra = await CatalogueFactory.apply('additional').merge({ price: '25000' }).create()

    const order = await taskService.createOfflineOrder(
      await staff(),
      counterOrder(catalogue.id, { items: [itemFor(catalogue.id, [extra.id])] })
    )

    assert.equal(Number(order.totalPrice), 100_000)

    const lines = await OrderItem.query().where('order_id', order.id)
    assert.lengthOf(lines, 2)
  })

  test('the goods handed over are recorded', async ({ assert }) => {
    const catalogue = await CatalogueFactory.create()

    const order = await taskService.createOfflineOrder(await staff(), counterOrder(catalogue.id))
    const items = await Item.query().where('order_id', order.id)

    assert.lengthOf(items, 1)
    assert.equal(items[0].brand, 'Nike')
  })

  test('the money is banked with the order', async ({ assert }) => {
    const catalogue = await CatalogueFactory.merge({ price: '75000' }).create()

    const order = await taskService.createOfflineOrder(await staff(), counterOrder(catalogue.id))
    const transaction = await Transaction.query().where('order_id', order.id).firstOrFail()

    assert.equal(transaction.status, TransactionStatus.PAID)
    assert.equal(transaction.paymentMethod, PaymentMethod.CASH)
    assert.equal(Number(transaction.cashReceived), 500_000)
  })

  test('the intake is written into the order history with its photo', async ({ assert }) => {
    const catalogue = await CatalogueFactory.create()
    const petugas = await staff()

    const order = await taskService.createOfflineOrder(petugas, counterOrder(catalogue.id))
    const actions = await OrderAction.query().where('order_id', order.id)

    assert.lengthOf(actions, 1)
    assert.equal(actions[0].name, ActionName.OFFLINE_ORDER)
    assert.equal(actions[0].userId, petugas.id)
    assert.isNotNull(actions[0].photoPath)
  })

  test('change is what is left of the cash after the bill', async ({ assert }) => {
    const catalogue = await CatalogueFactory.merge({ price: '75000' }).create()

    const order = await taskService.createOfflineOrder(await staff(), counterOrder(catalogue.id))
    const transaction = await Transaction.query().where('order_id', order.id).firstOrFail()

    assert.equal(taskService.changeFor(order, transaction), 425_000)
  })

  test('a card payment leaves no change to give back', async ({ assert }) => {
    const catalogue = await CatalogueFactory.merge({ price: '75000' }).create()

    const order = await taskService.createOfflineOrder(
      await staff(),
      counterOrder(catalogue.id, { paymentMethod: PaymentMethod.DEBIT, cashReceived: undefined })
    )
    const transaction = await Transaction.query().where('order_id', order.id).firstOrFail()

    assert.isNull(transaction.cashReceived)
    assert.equal(taskService.changeFor(order, transaction), 0)
  })

  test('each counter order gets its own number', async ({ assert }) => {
    const catalogue = await CatalogueFactory.create()
    const petugas = await staff()

    const first = await taskService.createOfflineOrder(petugas, counterOrder(catalogue.id))
    const second = await taskService.createOfflineOrder(petugas, counterOrder(catalogue.id))

    assert.notEqual(first.orderNumber, second.orderNumber)
  })
})

test.group('Counter orders | asking for delivery', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a linked account with an address becomes a walk-in delivery', async ({ assert }) => {
    const catalogue = await CatalogueFactory.create()
    const customer = await createCustomer()

    const order = await taskService.createOfflineOrder(
      await staff(),
      counterOrder(catalogue.id, { customerId: customer.user.id, delivery: true })
    )

    assert.equal(order.type, OrderType.WALK_IN_DELIVERY)
    assert.equal(order.addressId, customer.address.id)
    assert.equal(order.userId, customer.user.id)
  })

  test('delivery without an account is refused rather than quietly dropped', async ({ assert }) => {
    const catalogue = await CatalogueFactory.create()
    const petugas = await staff()

    const messages = await validationMessages(() =>
      taskService.createOfflineOrder(petugas, counterOrder(catalogue.id, { delivery: true }))
    )

    assert.deepInclude(
      messages.map((message) => message.field),
      'delivery'
    )
  })

  test('delivery is refused when the account has no saved address', async ({ assert }) => {
    const catalogue = await CatalogueFactory.create()
    const account = await UserFactory.create()
    const petugas = await staff()

    const messages = await validationMessages(() =>
      taskService.createOfflineOrder(
        petugas,
        counterOrder(catalogue.id, { customerId: account.id, delivery: true })
      )
    )

    assert.deepInclude(
      messages.map((message) => message.field),
      'delivery'
    )
  })

  test('a linked account that declines delivery stays an offline order', async ({ assert }) => {
    const catalogue = await CatalogueFactory.create()
    const customer = await createCustomer()

    const order = await taskService.createOfflineOrder(
      await staff(),
      counterOrder(catalogue.id, { customerId: customer.user.id })
    )

    assert.equal(order.type, OrderType.OFFLINE)
    assert.isNull(order.addressId)
    assert.equal(order.userId, customer.user.id)
  })
})

test.group('Counter orders | finding a customer', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a short search returns nothing rather than the whole book', async ({ assert }) => {
    await UserFactory.merge({ name: 'Budi Santoso' }).create()

    assert.isEmpty(await taskService.findCustomers('bu'))
  })

  test('customers are found by name', async ({ assert }) => {
    const customer = await UserFactory.merge({ name: 'Budi Santoso' }).create()

    const found = await taskService.findCustomers('budi')

    assert.include(
      found.map((user) => user.id),
      customer.id
    )
  })

  test('staff accounts never show up in the customer lookup', async ({ assert }) => {
    await UserFactory.apply('staff').merge({ name: 'Budi Petugas' }).create()

    assert.isEmpty(await taskService.findCustomers('budi petugas'))
  })
})

import { test } from '@japa/runner'
import AddressService from '#services/address_service'
import Item from '#models/item'
import Order from '#models/order'
import OrderService, { DAILY_PICKUP_LIMIT } from '#services/order_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { ItemType } from '#enums/item_enum'
import { OrderStatus, OrderType } from '#enums/order_enum'
import { OrderFactory } from '#database/factories/order_factory'
import { createCustomer, createItems, createOrder, validationMessages } from '#tests/utils/helpers'
import { DateTime } from 'luxon'

const orderService = new OrderService(new AddressService())

function stubOrder(attributes: Partial<Order>): Promise<Order> {
  return OrderFactory.merge(attributes as never).makeStubbed()
}

test.group('OrderService | status flow', () => {
  test('a booked pickup may only be collected or called off', async ({ assert }) => {
    const order = await stubOrder({ status: OrderStatus.PICKUP_SCHEDULED })

    assert.deepEqual(orderService.nextStatuses(order), [
      OrderStatus.IN_PICKUP,
      OrderStatus.CANCELLED,
    ])
  })

  test('an order cannot skip ahead to a later stage', async ({ assert }) => {
    const order = await stubOrder({ status: OrderStatus.PICKUP_SCHEDULED })

    assert.isFalse(orderService.canTransitionTo(order, OrderStatus.COMPLETED))
    assert.isFalse(orderService.canTransitionTo(order, OrderStatus.IN_CLEANING))
    assert.isTrue(orderService.canTransitionTo(order, OrderStatus.IN_PICKUP))
  })

  test('an order cannot move backwards', async ({ assert }) => {
    const order = await stubOrder({ status: OrderStatus.IN_CLEANING })

    assert.isFalse(orderService.canTransitionTo(order, OrderStatus.IN_INSPECTION))
    assert.isFalse(orderService.canTransitionTo(order, OrderStatus.AWAITING_PAYMENT))
  })

  test('washed goods go back on the van when the order has an address', async ({ assert }) => {
    const order = await stubOrder({
      status: OrderStatus.IN_CLEANING,
      type: OrderType.ONLINE,
      addressId: 1,
    })

    assert.isTrue(orderService.isDeliverable(order))
    assert.deepEqual(orderService.nextStatuses(order), [OrderStatus.IN_DELIVERY])
    assert.isFalse(orderService.canTransitionTo(order, OrderStatus.CLEANING_DONE))
  })

  test('washed goods wait on the shelf when there is nowhere to deliver them', async ({
    assert,
  }) => {
    const order = await stubOrder({
      status: OrderStatus.IN_CLEANING,
      type: OrderType.OFFLINE,
      addressId: null,
    })

    assert.isFalse(orderService.isDeliverable(order))
    assert.deepEqual(orderService.nextStatuses(order), [OrderStatus.CLEANING_DONE])
    assert.isFalse(orderService.canTransitionTo(order, OrderStatus.IN_DELIVERY))
  })

  test('a counter drop-off with a delivery request still goes on the van', async ({ assert }) => {
    const order = await stubOrder({
      status: OrderStatus.IN_CLEANING,
      type: OrderType.WALK_IN_DELIVERY,
      addressId: 1,
    })

    assert.deepEqual(orderService.nextStatuses(order), [OrderStatus.IN_DELIVERY])
  })

  test('cancelling closes once the goods have been collected', async ({ assert }) => {
    const scheduled = await stubOrder({ status: OrderStatus.PICKUP_SCHEDULED })

    assert.isTrue(orderService.canTransitionTo(scheduled, OrderStatus.CANCELLED))

    for (const status of [
      OrderStatus.IN_PICKUP,
      OrderStatus.IN_INSPECTION,
      OrderStatus.AWAITING_PAYMENT,
      OrderStatus.IN_CLEANING,
    ]) {
      const order = await stubOrder({ status })

      assert.isFalse(orderService.canTransitionTo(order, OrderStatus.CANCELLED))
    }
  })

  test('a finished order is final', async ({ assert }) => {
    const completed = await stubOrder({ status: OrderStatus.COMPLETED })
    const cancelled = await stubOrder({ status: OrderStatus.CANCELLED })

    assert.isEmpty(orderService.nextStatuses(completed))
    assert.isEmpty(orderService.nextStatuses(cancelled))
  })
})

test.group('OrderService | cancellation window', () => {
  test('the customer may cancel before the pickup day', async ({ assert }) => {
    const order = await stubOrder({
      status: OrderStatus.PICKUP_SCHEDULED,
      pickupDate: DateTime.now().plus({ days: 1 }),
    })

    assert.isTrue(orderService.canCancel(order))
  })

  test('the customer may not cancel on the pickup day itself', async ({ assert }) => {
    const order = await stubOrder({
      status: OrderStatus.PICKUP_SCHEDULED,
      pickupDate: DateTime.now(),
    })

    assert.isFalse(orderService.canCancel(order))
  })

  test('the customer may not cancel once the goods have been collected', async ({ assert }) => {
    const order = await stubOrder({
      status: OrderStatus.IN_PICKUP,
      pickupDate: DateTime.now().plus({ days: 1 }),
    })

    assert.isFalse(orderService.canCancel(order))
  })

  test('an order with no pickup day cannot be cancelled', async ({ assert }) => {
    const order = await stubOrder({
      status: OrderStatus.PICKUP_SCHEDULED,
      pickupDate: null,
    })

    assert.isFalse(orderService.canCancel(order))
  })
})

test.group('OrderService | booking', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('books a pickup against the active address', async ({ assert }) => {
    const { user, address } = await createCustomer()
    const pickupDate = DateTime.now().plus({ days: 2 })

    const order = await orderService.createOnlineOrder(user, {
      pickupDate,
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
    })

    assert.equal(order.userId, user.id)
    assert.equal(order.addressId, address.id)
    assert.equal(order.customerName, address.name)
    assert.equal(order.customerPhone, address.phone)
    assert.equal(order.status, OrderStatus.PICKUP_SCHEDULED)
    assert.equal(order.type, OrderType.ONLINE)
    assert.isNull(order.totalPrice)
    assert.match(order.orderNumber, /^ORD\d{4}-\d{4}$/)

    const items = await Item.query().where('order_id', order.id)

    assert.lengthOf(items, 1)
    assert.equal(items[0].brand, 'Nike')
  })

  test('refuses to book without a pickup address', async ({ assert }) => {
    const { user } = await createCustomer()

    await user.related('addresses').query().delete()

    const [failure] = await validationMessages(() =>
      orderService.createOnlineOrder(user, {
        pickupDate: DateTime.now().plus({ days: 1 }),
        items: [],
      })
    )

    assert.equal(failure.field, 'form')
    assert.match(failure.message, /alamat penjemputan/i)
  })

  test('refuses to book once the day is fully booked', async ({ assert }) => {
    const { user } = await createCustomer()
    const pickupDate = DateTime.now().plus({ days: 3 })

    await OrderFactory.merge({ pickupDate, status: OrderStatus.PICKUP_SCHEDULED }).createMany(
      DAILY_PICKUP_LIMIT
    )

    const [failure] = await validationMessages(() =>
      orderService.createOnlineOrder(user, { pickupDate, items: [] })
    )

    assert.equal(failure.field, 'pickupDate')
    assert.match(failure.message, /Kuota penjemputan/i)
  })

  test('a slot stays spent after the pickup has been made', async ({ assert }) => {
    const { user } = await createCustomer()
    const pickupDate = DateTime.now().plus({ days: 7 })

    await OrderFactory.merge({ pickupDate, status: OrderStatus.COMPLETED }).createMany(
      DAILY_PICKUP_LIMIT
    )

    const [failure] = await validationMessages(() =>
      orderService.createOnlineOrder(user, { pickupDate, items: [] })
    )

    assert.equal(failure.field, 'pickupDate')
    assert.match(failure.message, /Kuota penjemputan/i)
  })

  test('cancelled bookings free up their slot again', async ({ assert }) => {
    const { user } = await createCustomer()
    const pickupDate = DateTime.now().plus({ days: 4 })

    await OrderFactory.merge({ pickupDate, status: OrderStatus.PICKUP_SCHEDULED }).createMany(
      DAILY_PICKUP_LIMIT - 1
    )
    await OrderFactory.merge({ pickupDate }).apply('cancelled').createMany(3)

    const order = await orderService.createOnlineOrder(user, {
      pickupDate,
      items: [
        {
          type: ItemType.HELMET,
          brand: 'KYT',
          model: 'TT Course',
          size: 'L',
          material: 'Fiberglass',
          note: undefined,
        },
      ],
    })

    assert.equal(order.status, OrderStatus.PICKUP_SCHEDULED)
  })

  test('hands out order numbers in sequence within a month', async ({ assert }) => {
    const first = await orderService.generateOrderNumber()

    await OrderFactory.merge({ orderNumber: first }).create()

    const second = await orderService.generateOrderNumber()

    const [prefix, firstSequence] = first.split('-')
    const [secondPrefix, secondSequence] = second.split('-')

    assert.equal(prefix, `ORD${DateTime.now().toFormat('yyLL')}`)
    assert.equal(secondPrefix, prefix)
    assert.equal(Number(secondSequence), Number(firstSequence) + 1)
    assert.lengthOf(secondSequence, 4)
  })
})

test.group('OrderService | reading orders back', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists the customer orders newest first', async ({ assert }) => {
    const customer = await createCustomer()
    const stranger = await createCustomer()

    const older = await createOrder(customer, {
      attributes: { createdAt: DateTime.now().minus({ days: 2 }) },
    })
    const newer = await createOrder(customer)
    await createOrder(stranger)

    const orders = await orderService.getCustomerOrders(customer.user)

    assert.deepEqual(
      orders.map((order) => order.id),
      [newer.id, older.id]
    )
  })

  test('summarises the goods in each order', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { itemCount: 0 })

    await createItems(order, 2, 'shoe')
    await createItems(order, 1, 'helmet')

    const summaries = await orderService.itemSummaries([order.id])

    assert.sameMembers(summaries.get(order.id)!.split(', '), ['2 Sepatu', '1 Helm'])
  })

  test('summarising nothing costs no query', async ({ assert }) => {
    const summaries = await orderService.itemSummaries([])

    assert.equal(summaries.size, 0)
  })

  test('loads an order with its address and goods', async ({ assert }) => {
    const customer = await createCustomer()
    const created = await createOrder(customer, { itemCount: 2 })

    const order = await orderService.getCustomerOrderByNumber(customer.user, created.orderNumber)

    assert.equal(order.id, created.id)
    assert.equal(order.address.id, customer.address.id)
    assert.lengthOf(order.items, 2)
  })

  test("refuses to load someone else's order", async ({ assert }) => {
    const customer = await createCustomer()
    const stranger = await createCustomer()
    const order = await createOrder(customer)

    await assert.rejects(() =>
      orderService.getCustomerOrderByNumber(stranger.user, order.orderNumber)
    )
  })
})

test.group('OrderService | transitions in the database', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('moves an order to the next stage', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    await orderService.transitionTo(order, OrderStatus.IN_PICKUP)

    const stored = await Order.findOrFail(order.id)

    assert.equal(stored.status, OrderStatus.IN_PICKUP)
  })

  test('moving an order to the stage it is already in changes nothing', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    const result = await orderService.transitionTo(order, OrderStatus.PICKUP_SCHEDULED)

    assert.equal(result.status, OrderStatus.PICKUP_SCHEDULED)
  })

  test('rejects a stage the order cannot reach from here', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    const [failure] = await validationMessages(() =>
      orderService.transitionTo(order, OrderStatus.COMPLETED)
    )

    assert.equal(failure.field, 'status')
    assert.match(failure.message, /tidak dapat diubah/i)

    const stored = await Order.findOrFail(order.id)

    assert.equal(stored.status, OrderStatus.PICKUP_SCHEDULED)
  })

  test('cancels a booking that has not been collected', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    const cancelled = await orderService.cancelOrder(customer.user, order.orderNumber)

    assert.equal(cancelled.status, OrderStatus.CANCELLED)
  })

  test('refuses to cancel on the pickup day', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { states: ['pickupToday'] })

    const [failure] = await validationMessages(() =>
      orderService.cancelOrder(customer.user, order.orderNumber)
    )

    assert.equal(failure.field, 'form')
    assert.match(failure.message, /sebelum tanggal penjemputan/i)
  })

  test('refuses to cancel an order already on the van', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { states: ['collected'] })

    const [failure] = await validationMessages(() =>
      orderService.cancelOrder(customer.user, order.orderNumber)
    )

    assert.match(failure.message, /sebelum tanggal penjemputan/i)
  })
})

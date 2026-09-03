import { test } from '@japa/runner'
import Item from '#models/item'
import Order from '#models/order'
import testUtils from '@adonisjs/core/services/test_utils'
import { ItemType } from '#enums/item_enum'
import { OrderStatus, OrderType } from '#enums/order_enum'
import { MAX_ITEMS_PER_ORDER } from '#validators/order_validator'
import { DAILY_PICKUP_LIMIT } from '#services/order_service'
import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import {
  createCustomer,
  createOrder,
  inputErrors,
  itemFields,
  itemPayload,
  today,
  tomorrow,
} from '#tests/utils/helpers'
import { DateTime } from 'luxon'

test.group('Customer orders | the order list', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows the orders this customer has placed', async ({ client }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    const response = await client.get('/orders').loginAs(customer.user).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('customer/order/index')
    response.assertInertiaPropsContains({
      orders: [{ orderNumber: order.orderNumber, status: OrderStatus.PICKUP_SCHEDULED }],
    })
  })

  test("does not show another customer's orders", async ({ client, assert }) => {
    const customer = await createCustomer()
    const stranger = await createCustomer()

    await createOrder(stranger)

    const response = await client.get('/orders').loginAs(customer.user).withInertia()

    assert.isEmpty(response.inertiaProps.orders)
  })

  test('counts up the goods in each order', async ({ client, assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { itemCount: 3 })

    const response = await client.get('/orders').loginAs(customer.user).withInertia()

    assert.property(response.inertiaProps.summaries, String(order.id))
    assert.match(response.inertiaProps.summaries[order.id], /\d+ (Sepatu|Tas|Helm)/)
  })

  test('the booking form carries the pickup address', async ({ client }) => {
    const customer = await createCustomer()

    const response = await client.get('/orders/create').loginAs(customer.user).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('customer/order/create')
    response.assertInertiaPropsContains({ address: { street: customer.address.street } })
  })

  test('the booking form is honest when there is no address yet', async ({ client, assert }) => {
    const user = await UserFactory.create()

    const response = await client.get('/orders/create').loginAs(user).withInertia()

    response.assertStatus(200)
    assert.isNotOk(response.inertiaProps.address)
  })
})

test.group('Customer orders | booking a pickup', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('books a pickup and records the goods', async ({ client, assert }) => {
    const customer = await createCustomer()

    const response = await client
      .post('/orders')
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)
      .form({
        pickupDate: tomorrow(),
        ...itemFields([
          itemPayload(),
          itemPayload({
            type: ItemType.HELMET,
            brand: 'Shoei',
            model: 'GT Air',
            size: 'L',
            material: 'Fiberglass',
          }),
        ]),
      })

    response.assertStatus(302)
    response.assertFlashMessage('success')

    const order = await Order.query().where('user_id', customer.user.id).firstOrFail()

    assert.equal(order.status, OrderStatus.PICKUP_SCHEDULED)
    assert.equal(order.type, OrderType.ONLINE)
    assert.equal(order.addressId, customer.address.id)
    assert.equal(order.customerName, customer.address.name)
    assert.equal(order.customerPhone, customer.address.phone)
    assert.isNull(order.totalPrice)
    assert.match(order.orderNumber, /^ORD\d{4}-\d{4}$/)

    const items = await Item.query().where('order_id', order.id).orderBy('id', 'asc')

    assert.lengthOf(items, 2)
    assert.equal(items[0].brand, 'Nike')
    assert.equal(items[0].material, 'Kanvas')
    assert.equal(items[1].material, 'Fiberglass')
  })

  test('the customer is taken straight to the new order', async ({ client }) => {
    const customer = await createCustomer()

    const response = await client
      .post('/orders')
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)
      .form({ pickupDate: tomorrow(), ...itemFields([itemPayload()]) })

    const order = await Order.query().where('user_id', customer.user.id).firstOrFail()

    response.assertHeader('location', `/orders/${order.orderNumber}`)
  })

  test('numbers a second order after the first', async ({ client, assert }) => {
    const customer = await createCustomer()
    const goods = itemFields([itemPayload()])

    for (let booking = 0; booking < 2; booking++) {
      await client
        .post('/orders')
        .loginAs(customer.user)
        .withCsrfToken()
        .redirects(0)
        .form({ pickupDate: tomorrow(), ...goods })
    }

    const orders = await Order.query().where('user_id', customer.user.id).orderBy('id', 'asc')
    const sequence = orders.map((order) => Number(order.orderNumber.split('-')[1]))

    assert.lengthOf(orders, 2)
    assert.equal(sequence[1], sequence[0] + 1)
  })

  test('refuses a pickup booked for today', async ({ client, assert }) => {
    const customer = await createCustomer()

    const response = await client
      .post('/orders')
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)
      .form({ pickupDate: today(), ...itemFields([itemPayload()]) })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'pickupDate')
    assert.isEmpty(await Order.query().where('user_id', customer.user.id))
  })

  test('refuses a booking without any goods', async ({ client, assert }) => {
    const customer = await createCustomer()

    const response = await client
      .post('/orders')
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)
      .form({ pickupDate: tomorrow() })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'items')
    assert.isEmpty(await Order.query().where('user_id', customer.user.id))
  })

  test('refuses more goods than fit in one order', async ({ client, assert }) => {
    const customer = await createCustomer()

    const response = await client
      .post('/orders')
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)
      .form({
        pickupDate: tomorrow(),
        ...itemFields(Array.from({ length: MAX_ITEMS_PER_ORDER + 1 }, () => itemPayload())),
      })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'items')
    assert.isEmpty(await Order.query().where('user_id', customer.user.id))
  })

  test('refuses a kind of goods this laundry does not take', async ({ client, assert }) => {
    const customer = await createCustomer()

    const response = await client
      .post('/orders')
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)
      .form({ pickupDate: tomorrow(), ...itemFields([itemPayload({ type: 'jaket' })]) })

    response.assertStatus(302)
    assert.isEmpty(await Order.query().where('user_id', customer.user.id))
  })

  test('refuses to book before an address has been added', async ({ client, assert }) => {
    const user = await UserFactory.create()

    const response = await client
      .post('/orders')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
      .form({ pickupDate: tomorrow(), ...itemFields([itemPayload()]) })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'form')
    assert.isEmpty(await Order.query().where('user_id', user.id))
  })

  test('refuses to book a day that is already full', async ({ client, assert }) => {
    const customer = await createCustomer()
    const pickupDate = DateTime.now().plus({ days: 5 })

    await OrderFactory.merge({ pickupDate, status: OrderStatus.PICKUP_SCHEDULED }).createMany(
      DAILY_PICKUP_LIMIT
    )

    const response = await client
      .post('/orders')
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)
      .form({ pickupDate: pickupDate.toISODate()!, ...itemFields([itemPayload()]) })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'pickupDate')
    assert.isEmpty(await Order.query().where('user_id', customer.user.id))
  })

  test('a day stays full once its pickups have moved on', async ({ client, assert }) => {
    const customer = await createCustomer()
    const pickupDate = DateTime.now().plus({ days: 6 })

    await OrderFactory.merge({ pickupDate, status: OrderStatus.IN_CLEANING }).createMany(
      DAILY_PICKUP_LIMIT
    )

    const response = await client
      .post('/orders')
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)
      .form({ pickupDate: pickupDate.toISODate()!, ...itemFields([itemPayload()]) })

    response.assertStatus(302)
    assert.property(inputErrors(response), 'pickupDate')
    assert.isEmpty(await Order.query().where('user_id', customer.user.id))
  })
})

test.group('Customer orders | one order', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows the order with its address and goods', async ({ client }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { itemCount: 2 })

    const response = await client
      .get(`/orders/${order.orderNumber}`)
      .loginAs(customer.user)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('customer/order/show')
    response.assertInertiaPropsContains({
      order: {
        orderNumber: order.orderNumber,
        address: { street: customer.address.street },
      },
      canCancel: true,
    })
  })

  test('says so when the order can no longer be called off', async ({ client }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { states: ['collected'] })

    const response = await client
      .get(`/orders/${order.orderNumber}`)
      .loginAs(customer.user)
      .withInertia()

    response.assertInertiaPropsContains({ canCancel: false })
  })

  test("another customer's order is not found", async ({ client }) => {
    const customer = await createCustomer()
    const stranger = await createCustomer()
    const order = await createOrder(customer)

    const response = await client
      .get(`/orders/${order.orderNumber}`)
      .loginAs(stranger.user)
      .withInertia()

    response.assertStatus(404)
  })

  test('an order number that does not exist is not found', async ({ client }) => {
    const customer = await createCustomer()

    const response = await client.get('/orders/ORD9999-9999').loginAs(customer.user).withInertia()

    response.assertStatus(404)
  })
})

test.group('Customer orders | calling off a pickup', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('cancels an order that has not been collected yet', async ({ client, assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    const response = await client
      .delete(`/orders/${order.orderNumber}`)
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertFlashMessage('success', 'Pesanan berhasil dibatalkan.')

    await order.refresh()
    assert.equal(order.status, OrderStatus.CANCELLED)
  })

  test('the cancelled order is still on file', async ({ client, assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    await client
      .delete(`/orders/${order.orderNumber}`)
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)

    assert.isNotNull(await Order.findBy('order_number', order.orderNumber))
  })

  test('the old PUT route is gone', async ({ client }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    const response = await client
      .put(`/orders/${order.orderNumber}`)
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(404)
  })

  test('refuses to cancel an order already on the van', async ({ client, assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { states: ['collected'] })

    const response = await client
      .delete(`/orders/${order.orderNumber}`)
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.property(inputErrors(response), 'form')

    await order.refresh()
    assert.equal(order.status, OrderStatus.IN_PICKUP)
  })

  test('refuses to cancel on the pickup day itself', async ({ client, assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { states: ['pickupToday'] })

    const response = await client
      .delete(`/orders/${order.orderNumber}`)
      .loginAs(customer.user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)

    await order.refresh()
    assert.equal(order.status, OrderStatus.PICKUP_SCHEDULED)
  })

  test("never touches another customer's order", async ({ client, assert }) => {
    const customer = await createCustomer()
    const stranger = await createCustomer()
    const order = await createOrder(customer)

    const response = await client
      .delete(`/orders/${order.orderNumber}`)
      .loginAs(stranger.user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(404)

    await order.refresh()
    assert.equal(order.status, OrderStatus.PICKUP_SCHEDULED)
  })
})

test.group('Customer orders | the receipt', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('prints the order with its goods and recipient', async ({ client }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { itemCount: 2 })

    const response = await client
      .get(`/orders/${order.orderNumber}/receipt`)
      .loginAs(customer.user)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('customer/order/receipt')
    response.assertInertiaPropsContains({
      order: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        address: { street: customer.address.street },
      },
    })
  })

  test('an order that has not been priced shows no bill', async ({ client, assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    const response = await client
      .get(`/orders/${order.orderNumber}/receipt`)
      .loginAs(customer.user)
      .withInertia()

    assert.equal(response.inertiaProps.order.totalPrice, 0)
  })

  test("never prints another customer's receipt", async ({ client }) => {
    const customer = await createCustomer()
    const intruder = await createCustomer()
    const order = await createOrder(customer)

    const response = await client
      .get(`/orders/${order.orderNumber}/receipt`)
      .loginAs(intruder.user)
      .withInertia()

    response.assertStatus(404)
  })

  test('a guest is sent to sign in', async ({ client }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    const response = await client.get(`/orders/${order.orderNumber}/receipt`).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })
})

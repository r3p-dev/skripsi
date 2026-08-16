import { test } from '@japa/runner'
import Catalogue from '#models/catalogue'
import Order from '#models/order'
import Transaction from '#models/transaction'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { CatalogueFactory } from '#database/factories/catalogue_factory'
import { OrderStatus } from '#enums/order_enum'
import { PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import { Role } from '#enums/role_enum'
import { UserFactory } from '#database/factories/user_factory'
import { createCustomer, createOrder } from '#tests/utils/helpers'

function admin() {
  return UserFactory.apply('admin').create()
}

test.group('Admin | the screens load', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const screens = [
    { path: '/admin', component: 'admin/index' },
    { path: '/admin/orders', component: 'admin/order/index' },
    { path: '/admin/reconciliation', component: 'admin/reconciliation/index' },
    { path: '/admin/catalogues', component: 'admin/catalogue/index' },
    { path: '/admin/catalogues/create', component: 'admin/catalogue/create' },
    { path: '/admin/users', component: 'admin/user/index' },
    { path: '/admin/users/create', component: 'admin/user/create' },
    { path: '/admin/reports', component: 'admin/report/index' },
  ]

  for (const screen of screens) {
    test(`${screen.path} renders`, async ({ client }) => {
      const response = await client
        .get(screen.path)
        .loginAs(await admin())
        .withInertia()

      response.assertStatus(200)
      response.assertInertiaComponent(screen.component)
    })
  }

  test('staff cannot reach the admin area', async ({ client }) => {
    const staff = await UserFactory.apply('staff').create()

    const response = await client.get('/admin/orders').loginAs(staff).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/staff/profile')
  })
})

test.group('Admin | orders', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('an order can be opened by its number', async ({ client }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    const response = await client
      .get(`/admin/orders/${order.orderNumber}`)
      .loginAs(await admin())
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('admin/order/show')
  })

  test('the list can be filtered by status', async ({ client, assert }) => {
    const customer = await createCustomer()
    const scheduled = await createOrder(customer)
    const cleaning = await createOrder(customer, { states: ['inCleaning'] })

    const response = await client
      .get('/admin/orders')
      .qs({ status: OrderStatus.IN_CLEANING })
      .loginAs(await admin())
      .withInertia()

    const numbers = (response.inertiaProps.orders as { data: { orderNumber: string }[] }).data.map(
      (row) => row.orderNumber
    )

    assert.include(numbers, cleaning.orderNumber)
    assert.notInclude(numbers, scheduled.orderNumber)
  })

  test('the export downloads a spreadsheet', async ({ client }) => {
    const response = await client.get('/admin/orders/export').loginAs(await admin())

    response.assertStatus(200)
    response.assertHeader(
      'content-type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
  })
})

test.group('Admin | reconciliation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('only orders awaiting payment are listed', async ({ client, assert }) => {
    const customer = await createCustomer()
    const waiting = await createOrder(customer, {
      attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice: '120000' },
    })
    const cleaning = await createOrder(customer, { states: ['inCleaning'] })

    const response = await client
      .get('/admin/reconciliation')
      .loginAs(await admin())
      .withInertia()

    const numbers = (response.inertiaProps.orders as { data: { orderNumber: string }[] }).data.map(
      (row) => row.orderNumber
    )

    assert.include(numbers, waiting.orderNumber)
    assert.notInclude(numbers, cleaning.orderNumber)
  })

  test('confirming a payment by hand settles the order into cleaning', async ({
    client,
    assert,
  }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice: '120000' },
    })

    const response = await client
      .post(`/admin/reconciliation/${order.orderNumber}`)
      .loginAs(await admin())
      .withCsrfToken()
      .form({ paymentMethod: PaymentMethod.CASH, note: 'Bukti transfer sudah diterima' })
      .redirects(0)

    response.assertStatus(302)

    const updated = await Order.findOrFail(order.id)
    assert.equal(updated.status, OrderStatus.IN_CLEANING)

    const transaction = await Transaction.query()
      .where('order_id', order.id)
      .where('status', TransactionStatus.PAID)
      .first()

    assert.isNotNull(transaction)
  })

  test('a reason is required before money is confirmed', async ({ client, assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice: '120000' },
    })

    const response = await client
      .post(`/admin/reconciliation/${order.orderNumber}`)
      .loginAs(await admin())
      .withCsrfToken()
      // Deliberately missing the reason the validator insists on.
      .form({ paymentMethod: PaymentMethod.CASH } as never)
      .redirects(0)

    response.assertStatus(302)

    const untouched = await Order.findOrFail(order.id)
    assert.equal(untouched.status, OrderStatus.AWAITING_PAYMENT)
  })
})

test.group('Admin | catalogues', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a catalogue can be created', async ({ client, assert }) => {
    const response = await client
      .post('/admin/catalogues')
      .loginAs(await admin())
      .withCsrfToken()
      .form({
        catalogueName: 'Cuci Kilat',
        description: 'Selesai dalam satu hari',
        price: 90000,
        category: 'shoe_wash',
        type: 'regular',
      })
      .redirects(0)

    response.assertStatus(302)

    const created = await Catalogue.findBy('name', 'Cuci Kilat')
    assert.isNotNull(created)
  })

  test('an unused catalogue can be deleted', async ({ client, assert }) => {
    const catalogue = await CatalogueFactory.create()

    const response = await client
      .delete(`/admin/catalogues/${catalogue.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.isNull(await Catalogue.find(catalogue.id))
  })
})

test.group('Admin | users', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('an account can be created', async ({ client, assert }) => {
    const response = await client
      .post('/admin/users')
      .loginAs(await admin())
      .withCsrfToken()
      .form({
        name: 'Petugas Baru',
        phone: '081298765432',
        role: Role.STAFF,
        password: 'rahasia123',
        passwordConfirmation: 'rahasia123',
      })
      .redirects(0)

    response.assertStatus(302)

    const created = await User.findBy('phone', '+6281298765432')
    assert.isNotNull(created ?? (await User.findBy('name', 'Petugas Baru')))
  })

  test('an admin cannot delete their own account', async ({ client, assert }) => {
    const account = await admin()

    const response = await client
      .delete(`/admin/users/${account.id}`)
      .loginAs(account)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.isNotNull(await User.find(account.id))
  })

  test('an account with orders cannot be deleted', async ({ client, assert }) => {
    const customer = await createCustomer()
    await createOrder(customer)

    const response = await client
      .delete(`/admin/users/${customer.user.id}`)
      .loginAs(await admin())
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    assert.isNotNull(await User.find(customer.user.id))
  })
})

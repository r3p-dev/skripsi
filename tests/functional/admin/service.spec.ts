import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { ItemType, ServiceCategory, ServiceType } from '#enums/service_enum'
import Item from '#models/item'
import OrderItem from '#models/order_item'
import Service from '#models/service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

function createService(name = 'Cuci Sepatu Reguler', price = 30000) {
  return Service.create({
    name,
    description: 'Cuci sepatu standar',
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.REGULAR,
    price,
  })
}

/**
 * Puts a service on an order line, which is what makes it undeletable.
 */
async function useServiceOnAnOrder(service: Service) {
  const order = await OrderFactory.apply('waitingPayment').create()

  const item = await Item.create({
    type: ItemType.SHOE,
    brand: 'Nike',
    model: 'Air Max',
    material: 'Kanvas',
    size: '42',
    condition: 'Kotor ringan',
    note: null,
  })

  return OrderItem.create({
    orderId: order.id,
    itemId: item.id,
    serviceId: service.id,
    name: `${service.name} - ${item.brand} ${item.model}`,
    price: Number(service.price),
    subtotal: Number(service.price),
  })
}

test.group('Admin Service Catalogue', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('GET /admin/services lists the catalogue', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081320000001' }).create()
    await createService()

    const response = await client.get('/admin/services').withInertia().loginAs(admin)

    response.assertInertiaComponent('admin/service/index')
    assert.lengthOf(response.inertiaProps.services.data, 1)
    assert.equal(response.inertiaProps.services.data[0].name, 'Cuci Sepatu Reguler')
  })

  test('the search matches the name and the description', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081320001001' }).create()
    await createService('Repaint Sepatu')
    await createService('Cuci Helm')

    const response = await client
      .get('/admin/services')
      .qs({ search: 'Repaint' })
      .withInertia()
      .loginAs(admin)

    assert.lengthOf(response.inertiaProps.services.data, 1)
    assert.equal(response.inertiaProps.services.data[0].name, 'Repaint Sepatu')
  })

  test('POST /admin/services adds an entry to the catalogue', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081320002001' }).create()

    const response = await client
      .post('/admin/services')
      .loginAs(admin)
      .json({
        serviceName: 'Deep Clean Sepatu',
        description: 'Pembersihan menyeluruh luar dan dalam',
        price: 35000,
        category: ServiceCategory.SHOE_WASH,
        type: ServiceType.REGULAR,
      })
      .withCsrfToken()

    response.assertRedirectsTo('/admin/services')

    const service = await Service.findByOrFail('name', 'Deep Clean Sepatu')
    assert.equal(Number(service.price), 35000)
    assert.equal(service.category, ServiceCategory.SHOE_WASH)
  })

  test('a service with no price is refused', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081320002002' }).create()

    const response = await client
      .post('/admin/services')
      .withInertia()
      .loginAs(admin)
      .header('referer', '/admin/services/create')
      .json({
        serviceName: 'Gratis Saja',
        description: 'Tidak berbayar',
        price: 0,
        category: ServiceCategory.SHOE_WASH,
        type: ServiceType.REGULAR,
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({ errors: { price: 'Harga harus bernilai positif' } })
    assert.isNull(await Service.findBy('name', 'Gratis Saja'))
  })

  test('PUT /admin/services/:id changes the asking price', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081320003001' }).create()
    const service = await createService()

    const response = await client
      .put(`/admin/services/${service.id}`)
      .loginAs(admin)
      .json({
        serviceName: service.name,
        description: service.description,
        price: 45000,
        category: service.category,
        type: service.type,
      })
      .withCsrfToken()

    response.assertRedirectsTo('/admin/services')

    await service.refresh()
    assert.equal(Number(service.price), 45000)
  })

  /**
   * The price is copied onto the order line at inspection time, so a
   * catalogue change must never rewrite what a customer was already quoted.
   */
  test('repricing a service leaves already-quoted orders alone', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081320003002' }).create()
    const service = await createService()
    const orderItem = await useServiceOnAnOrder(service)

    await client
      .put(`/admin/services/${service.id}`)
      .loginAs(admin)
      .json({
        serviceName: service.name,
        description: service.description,
        price: 99000,
        category: service.category,
        type: service.type,
      })
      .withCsrfToken()

    await orderItem.refresh()
    assert.equal(Number(orderItem.subtotal), 30000)
  })

  test('DELETE /admin/services/:id removes an unused entry', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081320004001' }).create()
    const service = await createService()

    const response = await client
      .delete(`/admin/services/${service.id}`)
      .loginAs(admin)
      .withCsrfToken()

    response.assertRedirectsTo('/admin/services')
    assert.isNull(await Service.find(service.id))
  })

  test('a service that has priced an order cannot be deleted', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081320005001' }).create()
    const service = await createService()
    await useServiceOnAnOrder(service)

    const response = await client
      .delete(`/admin/services/${service.id}`)
      .withInertia()
      .loginAs(admin)
      .header('referer', '/admin/services')
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: { id: 'Layanan ini sudah dipakai pada pesanan dan tidak dapat dihapus.' },
    })

    assert.isNotNull(await Service.find(service.id))
  })

  test('the list marks which entries are already in use', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081320006001' }).create()
    const used = await createService('Cuci Sepatu Reguler')
    const unused = await createService('Cuci Helm')
    await useServiceOnAnOrder(used)

    const response = await client.get('/admin/services').withInertia().loginAs(admin)

    assert.deepEqual(response.inertiaProps.inUseIds, [used.id])
    assert.notInclude(response.inertiaProps.inUseIds, unused.id)
  })

  test('the edit page sends the raw price the form needs', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081320007001' }).create()
    const service = await createService()

    const response = await client
      .get(`/admin/services/${service.id}/edit`)
      .withInertia()
      .loginAs(admin)

    response.assertInertiaComponent('admin/service/edit')
    assert.strictEqual(response.inertiaProps.service.price, 30000)
    assert.equal(response.inertiaProps.service.category, ServiceCategory.SHOE_WASH)
    assert.isFalse(response.inertiaProps.isInUse)
  })

  test('a customer cannot reach the catalogue', async ({ client }) => {
    const customer = await UserFactory.merge({ phone: '081320008001' }).create()

    const response = await client.get('/admin/services').withInertia().loginAs(customer)

    response.assertRedirectsTo('/order')
  })
})

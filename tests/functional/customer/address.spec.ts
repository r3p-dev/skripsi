import { UserFactory } from '#database/factories/user_factory'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('GET Pages', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('GET /address returns customer/address/show', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.visit('customer.address.show').loginAs(user).withInertia()

    response.assertInertiaComponent('customer/address/show')
  })

  test('GET /address returns customer/address/create', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.visit('customer.address.create').loginAs(user).withInertia()

    response.assertInertiaComponent('customer/address/form')
  })
})

test.group('Validation Errors', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('POST /address returns validation errors for invalid name', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        recipientName: 'Invalid N4m3_',
        recipientPhone: '081313293859',
        addressDetail: 'Jalan Braga',
        latitude: -6.9555305,
        longitude: 107.6540353,
        note: 'Tolong diantar ke depan rumah',
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        recipientName: 'Nama lengkap penerima hanya boleh berisi huruf',
      },
      flash: {},
    })
  })

  test('POST /address returns validation errors for invalid phone', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        recipientName: 'Valid Name',
        recipientPhone: 'waduh',
        addressDetail: 'Jalan Braga',
        latitude: -6.9555305,
        longitude: 107.6540353,
        note: 'Tolong diantar ke depan rumah',
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        recipientPhone: 'Nomor telepon memiliki format yang tidak valid',
      },
      flash: {},
    })
  })

  test('POST /address returns validation errors for invalid address detail', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        recipientName: 'Valid Name',
        recipientPhone: '081313293859',
        addressDetail: '',
        latitude: -6.9555305,
        longitude: 107.6540353,
        note: 'Tolong diantar ke depan rumah',
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        addressDetail: 'Alamat wajib diisi',
      },
      flash: {},
    })
  })

  test('POST /address returns validation errors for invalid latitude', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        recipientName: 'Valid Name',
        recipientPhone: '081313293859',
        addressDetail: 'Jalan Braga',
        latitude: '',
        longitude: 107.6540353,
        note: 'Tolong diantar ke depan rumah',
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        latitude: 'Latitude wajib diisi',
      },
      flash: {},
    })
  })

  test('POST /address returns validation errors for invalid longitude', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        recipientName: 'Valid Name',
        recipientPhone: '081313293859',
        addressDetail: 'Jalan Braga',
        latitude: -6.9555305,
        longitude: '',
        note: 'Tolong diantar ke depan rumah',
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        longitude: 'Longitude wajib diisi',
      },
      flash: {},
    })
  })

  test('POST /address returns validation errors for invalid location', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        recipientName: 'Valid Name',
        recipientPhone: '081313293859',
        addressDetail: 'Jalan Braga',
        latitude: -16.9555305,
        longitude: 127.6540353,
        note: 'Tolong diantar ke depan rumah',
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        radius: 'Alamat Anda tidak berada dalam area layanan. Silakan pilih lokasi lain.',
      },
      flash: {},
    })
  })
})

test.group('POST Succeeds', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('POST /address succeeds for valid data', async ({ client, db }) => {
    const user = await UserFactory.create()

    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        recipientName: 'Valid Name',
        recipientPhone: '081313293859',
        addressDetail: 'Jalan Braga',
        latitude: -6.9555305,
        longitude: 107.6540353,
        note: 'Tolong diantar ke depan rumah',
      })
      .loginAs(user)
      .withCsrfToken()

    await db.assertHas(
      'addresses',
      {
        user_id: user.id,
        recipient_name: 'Valid Name',
        recipient_phone: '081313293859',
        address_detail: 'Jalan Braga',
        latitude: -6.9555305,
        longitude: 107.6540353,
        note: 'Tolong diantar ke depan rumah',
        is_active: true,
      },
      1
    )
    response.assertRedirectsTo('/address')
  })

  test('POST /address succeeds for valid existing data', async ({ client, db }) => {
    const user = await UserFactory.with('addresses', 1, (address) => {
      address.merge([
        {
          recipientName: 'Valid Name satu',
          recipientPhone: '081313293859',
          addressDetail: 'Jalan Braga',
          latitude: -6.9555306,
          longitude: 107.6540354,
          note: 'Tolong diantar ke depan rumah',
          isActive: true,
        },
      ])
    }).create()

    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        recipientName: 'Valid Name dua',
        recipientPhone: '081313293859',
        addressDetail: 'Jalan Braga',
        latitude: -6.9555305,
        longitude: 107.6540353,
        note: 'Tolong diantar ke depan rumah',
      })
      .loginAs(user)
      .withCsrfToken()

    await db.assertHas(
      'addresses',
      {
        user_id: user.id,
        recipient_name: 'Valid Name dua',
        recipient_phone: '081313293859',
        address_detail: 'Jalan Braga',
        latitude: -6.9555305,
        longitude: 107.6540353,
        note: 'Tolong diantar ke depan rumah',
        is_active: true,
      },
      1
    )

    await db.assertHas(
      'addresses',
      {
        user_id: user.id,
        recipient_name: 'Valid Name satu',
        recipient_phone: '081313293859',
        address_detail: 'Jalan Braga',
        latitude: -6.9555306,
        longitude: 107.6540354,
        note: 'Tolong diantar ke depan rumah',
        is_active: false,
      },
      1
    )

    await db.assertHas(
      'addresses',
      {
        user_id: user.id,
      },
      2
    )
    response.assertRedirectsTo('/address')
  })
})

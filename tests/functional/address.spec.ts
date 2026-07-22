import Address from '#models/address'
import { createUser } from '#tests/utils/helpers'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('GET Pages', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('GET /address returns customer/address/show', async ({ client }) => {
    const user = await createUser()

    const response = await client.visit('customer.address.show').loginAs(user).withInertia()

    response.assertInertiaComponent('customer/address/show')
  })

  test('GET /address returns customer/address/create', async ({ client }) => {
    const user = await createUser()

    const response = await client.visit('customer.address.create').loginAs(user).withInertia()

    response.assertInertiaComponent('customer/address/form')
  })
})

test.group('Validation Errors', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('POST /address returns validation errors for invalid name', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        name: 'Invalid N4m3_',
        phone: '6281313293859',
        street: 'Jalan Braga',
        latitude: -6.9555305,
        longitude: 107.6540353,
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        name: 'Nama Lengkap hanya boleh berisi huruf',
      },
      flash: {},
    })
  })

  test('POST /address returns validation errors for invalid phone', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        name: 'Valid Name',
        phone: 'waduh',
        street: 'Jalan Braga',
        latitude: -6.9555305,
        longitude: 107.6540353,
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        phone: 'Nomor Telepon harus berupa nomor HP Indonesia yang valid',
      },
      flash: {},
    })
  })

  test('POST /address returns validation errors for invalid street', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        name: 'Valid Name',
        phone: '6281313293859',
        street: '',
        latitude: -6.9555305,
        longitude: 107.6540353,
      })
      .loginAs(user)
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        street: 'Alamat wajib diisi',
      },
      flash: {},
    })
  })

  test('POST /address returns validation errors for invalid latitude', async ({ client }) => {
    const user = await createUser()
    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        name: 'Valid Name',
        phone: '6281313293859',
        street: 'Jalan Braga',
        latitude: '',
        longitude: 107.6540353,
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
    const user = await createUser()
    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        name: 'Valid Name',
        phone: '6281313293859',
        street: 'Jalan Braga',
        latitude: -6.9555305,
        longitude: '',
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
    const user = await createUser()
    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        name: 'Valid Name',
        phone: '6281313293859',
        street: 'Jalan Braga',
        latitude: -16.9555305,
        longitude: 127.6540353,
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

test.group('POST succeeds', (group) => {
  group.each.setup(() => {
    return testUtils.db().truncate()
  })

  test('POST /address succeeds for valid data', async ({ client, db }) => {
    const user = await createUser()
    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        name: 'Valid Name',
        phone: '6281313293859',
        street: 'Jalan Braga',
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
        recipient_phone: '6281313293859',
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
    const user = await createUser()
    await Address.create({
      userId: user.id,
      recipientName: 'Valid Name satu',
      recipientPhone: '6281313293859',
      addressDetail: 'Jalan Braga',
      latitude: -6.9555306,
      longitude: 107.6540354,
      note: 'Tolong diantar ke depan rumah',
      isActive: true,
    })

    const response = await client
      .visit('customer.address.store')
      .withInertia()
      .header('referer', '/address/create')
      .json({
        name: 'Valid Name dua',
        phone: '6281313293859',
        street: 'Jalan Braga',
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
        recipient_phone: '6281313293859',
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
        recipient_phone: '6281313293859',
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

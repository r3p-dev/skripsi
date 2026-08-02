import { UserFactory } from '#database/factories/user_factory'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Address', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('POST /address returns validation errors for invalid payload', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .post('/address')
      .withInertia()
      .loginAs(user)
      .header('referer', '/address')
      .json({
        name: 'Invalid Name #3_',
        phone: 'invalid-phone',
        street: '',
        latitude: -100,
        longitude: 200,
        note: 'Catatan tambahan',
      })
      .withCsrfToken()

    response.assertInertiaPropsContains({
      errors: {
        name: 'Nama lengkap hanya boleh berisi huruf',
        phone: 'Nomor telepon harus berupa nomor HP Indonesia yang valid',
        street: 'Alamat wajib diisi',
        latitude: 'Latitude minimal -90',
        longitude: 'Longitude maksimal 180',
      },
      flash: {},
    })
  })
})

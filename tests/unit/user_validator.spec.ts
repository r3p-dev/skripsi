import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { Role } from '#enums/role_enum'
import { userValidator } from '#validators/user_validator'
import { USER_PASSWORD, UserFactory } from '#database/factories/user_factory'
import { uniquePhone } from '#database/factories/support'
import { invalidFields, validationMessages } from '#tests/utils/helpers'

function userPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Petugas Baru',
    phone: uniquePhone(),
    password: USER_PASSWORD,
    passwordConfirmation: USER_PASSWORD,
    role: Role.STAFF,
    ...overrides,
  }
}

test.group('userValidator', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('accepts a complete account', async ({ assert }) => {
    const payload = await userValidator.validate(userPayload())

    assert.equal(payload.name, 'Petugas Baru')
    assert.equal(payload.role, Role.STAFF)
  })

  test('accepts every role', async ({ assert }) => {
    for (const role of Object.values(Role)) {
      const payload = await userValidator.validate(userPayload({ role }))

      assert.equal(payload.role, role)
    }
  })

  test('refuses a role that does not exist', async ({ assert }) => {
    const fields = await invalidFields(() => userValidator.validate(userPayload({ role: 'owner' })))

    assert.include(fields, 'role')
  })

  test('demands every field', async ({ assert }) => {
    const fields = await invalidFields(() => userValidator.validate({}))

    assert.includeMembers(fields, ['name', 'phone', 'password', 'role'])
  })

  test('refuses a phone number another account already holds', async ({ assert }) => {
    const existing = await UserFactory.create()

    const [failure] = await validationMessages(() =>
      userValidator.validate(userPayload({ phone: existing.phone }))
    )

    assert.equal(failure.field, 'phone')
    assert.match(failure.message, /sudah digunakan/i)
  })

  test('refuses a password that is not confirmed', async ({ assert }) => {
    const fields = await invalidFields(() =>
      userValidator.validate(userPayload({ passwordConfirmation: 'sandilain9' }))
    )

    assert.include(fields, 'passwordConfirmation')
  })

  test('refuses a name with digits in it', async ({ assert }) => {
    const fields = await invalidFields(() =>
      userValidator.validate(userPayload({ name: 'Petugas 7' }))
    )

    assert.include(fields, 'name')
  })

  test('refuses a phone number that is not Indonesian', async ({ assert }) => {
    const fields = await invalidFields(() =>
      userValidator.validate(userPayload({ phone: '12345' }))
    )

    assert.include(fields, 'phone')
  })
})

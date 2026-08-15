import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import {
  forgotPasswordValidator,
  loginValidator,
  resetPasswordValidator,
  signupValidator,
} from '#validators/auth_validator'
import { USER_PASSWORD, UserFactory } from '#database/factories/user_factory'
import { invalidFields, validationMessages } from '#tests/utils/helpers'

function signupPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Pelanggan Uji',
    phone: '081200009001',
    password: USER_PASSWORD,
    passwordConfirmation: USER_PASSWORD,
    ...overrides,
  }
}

test.group('loginValidator', () => {
  test('accepts a phone number and password', async ({ assert }) => {
    const payload = await loginValidator.validate({
      phone: '081200009002',
      password: USER_PASSWORD,
    })

    assert.equal(payload.phone, '081200009002')
  })

  test('remembering the device is optional', async ({ assert }) => {
    const payload = await loginValidator.validate({
      phone: '081200009003',
      password: USER_PASSWORD,
      rememberMe: 'on',
    })

    assert.isTrue(payload.rememberMe)
  })

  test('demands both a phone number and a password', async ({ assert }) => {
    const fields = await invalidFields(() => loginValidator.validate({}))

    assert.includeMembers(fields, ['phone', 'password'])
  })

  test('refuses a phone number that is not Indonesian', async ({ assert }) => {
    const fields = await invalidFields(() =>
      loginValidator.validate({ phone: '+1 555 0100', password: USER_PASSWORD })
    )

    assert.include(fields, 'phone')
  })
})

test.group('signupValidator', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('accepts a complete registration', async ({ assert }) => {
    const payload = await signupValidator.validate(signupPayload())

    assert.equal(payload.name, 'Pelanggan Uji')
    assert.equal(payload.password, USER_PASSWORD)
  })

  test('refuses a phone number already registered', async ({ assert }) => {
    const existing = await UserFactory.create()

    const [failure] = await validationMessages(() =>
      signupValidator.validate(signupPayload({ phone: existing.phone }))
    )

    assert.equal(failure.field, 'phone')
    assert.match(failure.message, /sudah digunakan/i)
  })

  test('refuses a password that is not confirmed', async ({ assert }) => {
    const fields = await invalidFields(() =>
      signupValidator.validate(signupPayload({ passwordConfirmation: 'sandilain9' }))
    )

    assert.include(fields, 'passwordConfirmation')
  })

  test('refuses a password with no digit in it', async ({ assert }) => {
    const fields = await invalidFields(() =>
      signupValidator.validate(
        signupPayload({ password: 'hanyahuruf', passwordConfirmation: 'hanyahuruf' })
      )
    )

    assert.include(fields, 'password')
  })

  test('refuses a password with no letter in it', async ({ assert }) => {
    const fields = await invalidFields(() =>
      signupValidator.validate(
        signupPayload({ password: '12345678', passwordConfirmation: '12345678' })
      )
    )

    assert.include(fields, 'password')
  })

  test('refuses a password shorter than eight characters', async ({ assert }) => {
    const fields = await invalidFields(() =>
      signupValidator.validate(
        signupPayload({ password: 'sandi1', passwordConfirmation: 'sandi1' })
      )
    )

    assert.include(fields, 'password')
  })

  test('refuses a password longer than sixteen characters', async ({ assert }) => {
    const tooLong = 'sandipanjangsekali1'

    const fields = await invalidFields(() =>
      signupValidator.validate(signupPayload({ password: tooLong, passwordConfirmation: tooLong }))
    )

    assert.include(fields, 'password')
  })

  test('refuses a name with digits in it', async ({ assert }) => {
    const fields = await invalidFields(() =>
      signupValidator.validate(signupPayload({ name: 'Pelanggan 123' }))
    )

    assert.include(fields, 'name')
  })

  test('accepts a name with spaces and dashes', async ({ assert }) => {
    const payload = await signupValidator.validate(signupPayload({ name: 'Siti Nur-Aini' }))

    assert.equal(payload.name, 'Siti Nur-Aini')
  })

  test('refuses a name with underscores', async ({ assert }) => {
    const fields = await invalidFields(() =>
      signupValidator.validate(signupPayload({ name: 'Siti_Nur' }))
    )

    assert.include(fields, 'name')
  })

  test('refuses a name longer than fifty characters', async ({ assert }) => {
    const fields = await invalidFields(() =>
      signupValidator.validate(signupPayload({ name: 'a'.repeat(51) }))
    )

    assert.include(fields, 'name')
  })

  test('trims the name before storing it', async ({ assert }) => {
    const payload = await signupValidator.validate(signupPayload({ name: '  Pelanggan Uji  ' }))

    assert.equal(payload.name, 'Pelanggan Uji')
  })
})

test.group('forgotPasswordValidator', () => {
  test('accepts a phone number on its own', async ({ assert }) => {
    const payload = await forgotPasswordValidator.validate({ phone: '081200009004' })

    assert.equal(payload.phone, '081200009004')
  })

  test('refuses a phone number that is not Indonesian', async ({ assert }) => {
    const fields = await invalidFields(() => forgotPasswordValidator.validate({ phone: '12345' }))

    assert.include(fields, 'phone')
  })
})

test.group('resetPasswordValidator', () => {
  test('accepts a confirmed password', async ({ assert }) => {
    const payload = await resetPasswordValidator.validate({
      password: 'sandibaru9',
      passwordConfirmation: 'sandibaru9',
    })

    assert.equal(payload.password, 'sandibaru9')
  })

  test('refuses a mismatched confirmation', async ({ assert }) => {
    const fields = await invalidFields(() =>
      resetPasswordValidator.validate({
        password: 'sandibaru9',
        passwordConfirmation: 'sandilain9',
      })
    )

    assert.include(fields, 'passwordConfirmation')
  })

  test('refuses a password with a symbol in it', async ({ assert }) => {
    const fields = await invalidFields(() =>
      resetPasswordValidator.validate({
        password: 'sandi!baru9',
        passwordConfirmation: 'sandi!baru9',
      })
    )

    assert.include(fields, 'password')
  })
})

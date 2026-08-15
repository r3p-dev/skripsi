import { test } from '@japa/runner'
import {
  changeNameValidator,
  changePasswordValidator,
  changePhoneValidator,
} from '#validators/profile_validator'
import { USER_PASSWORD } from '#database/factories/user_factory'
import { invalidFields } from '#tests/utils/helpers'

test.group('changePasswordValidator', () => {
  test('accepts a confirmed new password alongside the current one', async ({ assert }) => {
    const payload = await changePasswordValidator.validate({
      currentPassword: USER_PASSWORD,
      password: 'sandibaru9',
      passwordConfirmation: 'sandibaru9',
    })

    assert.equal(payload.currentPassword, USER_PASSWORD)
    assert.equal(payload.password, 'sandibaru9')
  })

  test('demands the current password', async ({ assert }) => {
    const fields = await invalidFields(() =>
      changePasswordValidator.validate({
        password: 'sandibaru9',
        passwordConfirmation: 'sandibaru9',
      })
    )

    assert.include(fields, 'currentPassword')
  })

  test('refuses a mismatched confirmation', async ({ assert }) => {
    const fields = await invalidFields(() =>
      changePasswordValidator.validate({
        currentPassword: USER_PASSWORD,
        password: 'sandibaru9',
        passwordConfirmation: 'sandilain9',
      })
    )

    assert.include(fields, 'passwordConfirmation')
  })

  test('holds the new password to the same rules as the old one', async ({ assert }) => {
    const fields = await invalidFields(() =>
      changePasswordValidator.validate({
        currentPassword: USER_PASSWORD,
        password: 'pendek1',
        passwordConfirmation: 'pendek1',
      })
    )

    assert.include(fields, 'password')
  })
})

test.group('changeNameValidator', () => {
  test('accepts a name', async ({ assert }) => {
    const payload = await changeNameValidator.validate({ name: 'Nama Baru' })

    assert.equal(payload.name, 'Nama Baru')
  })

  test('trims the name', async ({ assert }) => {
    const payload = await changeNameValidator.validate({ name: '  Nama Baru  ' })

    assert.equal(payload.name, 'Nama Baru')
  })

  test('refuses an empty name', async ({ assert }) => {
    assert.include(await invalidFields(() => changeNameValidator.validate({ name: '' })), 'name')
  })

  test('refuses a name with digits in it', async ({ assert }) => {
    const fields = await invalidFields(() => changeNameValidator.validate({ name: 'Nama 123' }))

    assert.include(fields, 'name')
  })

  test('refuses a name longer than fifty characters', async ({ assert }) => {
    const fields = await invalidFields(() => changeNameValidator.validate({ name: 'a'.repeat(51) }))

    assert.include(fields, 'name')
  })
})

test.group('changePhoneValidator', () => {
  test('accepts an Indonesian phone number', async ({ assert }) => {
    const payload = await changePhoneValidator.validate({ phone: '081200009201' })

    assert.equal(payload.phone, '081200009201')
  })

  test('refuses a phone number that is not Indonesian', async ({ assert }) => {
    const fields = await invalidFields(() =>
      changePhoneValidator.validate({ phone: '+1 555 0100' })
    )

    assert.include(fields, 'phone')
  })

  test('demands a phone number', async ({ assert }) => {
    assert.include(await invalidFields(() => changePhoneValidator.validate({})), 'phone')
  })
})

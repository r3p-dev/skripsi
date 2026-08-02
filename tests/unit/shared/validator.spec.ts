import { name, password, phone } from '#validators/shared'
import { test } from '@japa/runner'
import vine from '@vinejs/vine'

test.group('Name', () => {
  test('accepts valid name', async ({ assert }) => {
    const result = await vine.validate({
      schema: vine.object({ name: name() }),
      data: { name: 'John Doe' },
    })

    assert.equal(result.name, 'John Doe')
  })

  test('rejects empty name', async ({ assert }) => {
    await assert.rejects(() =>
      vine.validate({
        schema: vine.object({ name: name() }),
        data: { name: '' },
      })
    )
  })

  test('rejects name longer than 50 chars', async ({ assert }) => {
    await assert.rejects(() =>
      vine.validate({
        schema: vine.object({ name: name() }),
        data: { name: 'a'.repeat(51) },
      })
    )
  })

  test('rejects name with invalid characters', async ({ assert }) => {
    await assert.rejects(() =>
      vine.validate({
        schema: vine.object({ name: name() }),
        data: { name: 'John123' },
      })
    )
  })

  test('trims whitespace from name', async ({ assert }) => {
    const result = await vine.validate({
      schema: vine.object({ name: name() }),
      data: { name: '  John  ' },
    })

    assert.equal(result.name, 'John')
  })
})

test.group('Phone', () => {
  test('accepts valid phone number', async ({ assert }) => {
    const result = await vine.validate({
      schema: vine.object({ phone: phone() }),
      data: { phone: '081387882973' },
    })

    assert.equal(result.phone, '081387882973')
  })

  test('rejects invalid phone number', async ({ assert }) => {
    await assert.rejects(() =>
      vine.validate({
        schema: vine.object({ phone: phone() }),
        data: { phone: 'invalid-phone' },
      })
    )
  })

  test('rejects phone number longer than 15 characters', async ({ assert }) => {
    await assert.rejects(() =>
      vine.validate({
        schema: vine.object({ phone: phone() }),
        data: { phone: '08138788297312345' },
      })
    )
  })

  test('rejects phone number shorter than 10 characters', async ({ assert }) => {
    await assert.rejects(() =>
      vine.validate({
        schema: vine.object({ phone: phone() }),
        data: { phone: '08138' },
      })
    )
  })

  test('trims whitespace from phone number', async ({ assert }) => {
    const result = await vine.validate({
      schema: vine.object({ phone: phone() }),
      data: { phone: ' 081387882973 ' },
    })

    assert.equal(result.phone, '081387882973')
  })
})

test.group('Password', () => {
  test('accepts valid password', async ({ assert }) => {
    const result = await vine.validate({
      schema: vine.object({
        password: password().confirmed({ as: 'passwordConfirmation' }),
      }),
      data: {
        password: 'password123',
        passwordConfirmation: 'password123',
      },
    })

    assert.equal(result.password, 'password123')
  })

  test('rejects empty password', async ({ assert }) => {
    await assert.rejects(() =>
      vine.validate({
        schema: vine.object({
          password: password().confirmed({ as: 'passwordConfirmation' }),
        }),
        data: {
          password: '',
          passwordConfirmation: '',
        },
      })
    )
  })

  test('rejects short password', async ({ assert }) => {
    await assert.rejects(() =>
      vine.validate({
        schema: vine.object({
          password: password().confirmed({ as: 'passwordConfirmation' }),
        }),
        data: {
          password: 'short',
          passwordConfirmation: 'short',
        },
      })
    )
  })

  test('rejects long password', async ({ assert }) => {
    await assert.rejects(() =>
      vine.validate({
        schema: vine.object({
          password: password().confirmed({ as: 'passwordConfirmation' }),
        }),
        data: {
          password: 'a'.repeat(17),
          passwordConfirmation: 'a'.repeat(17),
        },
      })
    )
  })

  test('rejects password without digits', async ({ assert }) => {
    await assert.rejects(() =>
      vine.validate({
        schema: vine.object({
          password: password().confirmed({ as: 'passwordConfirmation' }),
        }),
        data: {
          password: 'password',
          passwordConfirmation: 'password',
        },
      })
    )
  })

  test('rejects password without letters', async ({ assert }) => {
    await assert.rejects(() =>
      vine.validate({
        schema: vine.object({
          password: password().confirmed({ as: 'passwordConfirmation' }),
        }),
        data: {
          password: '12345678',
          passwordConfirmation: '12345678',
        },
      })
    )
  })

  test('rejects password confirmation mismatch', async ({ assert }) => {
    await assert.rejects(() =>
      vine.validate({
        schema: vine.object({
          password: password().confirmed({ as: 'passwordConfirmation' }),
        }),
        data: {
          password: 'password123',
          passwordConfirmation: 'differentPassword',
        },
      })
    )
  })

  test('rejects password with symbols', async ({ assert }) => {
    await assert.rejects(() =>
      vine.validate({
        schema: vine.object({
          password: password().confirmed({ as: 'passwordConfirmation' }),
        }),
        data: {
          password: 'password@123',
          passwordConfirmation: 'password@123',
        },
      })
    )
  })

  test('trims whitespace from password', async ({ assert }) => {
    const result = await vine.validate({
      schema: vine.object({
        password: password().confirmed({ as: 'passwordConfirmation' }),
      }),
      data: {
        password: '  password123  ',
        passwordConfirmation: 'password123',
      },
    })

    assert.equal(result.password, 'password123')
  })
})

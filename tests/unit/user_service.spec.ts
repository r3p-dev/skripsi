import { test } from '@japa/runner'
import User from '#models/user'
import UserService from '#services/user_service'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { Role } from '#enums/role_enum'
import { USER_PASSWORD, UserFactory } from '#database/factories/user_factory'
import { uniquePhone } from '#database/factories/support'

const userService = new UserService()

test.group('UserService | reading accounts', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('finds an account by id', async ({ assert }) => {
    const user = await UserFactory.create()

    const found = await userService.getUserById(user.id)

    assert.equal(found?.id, user.id)
  })

  test('returns nothing for an id that does not exist', async ({ assert }) => {
    assert.isNull(await userService.getUserById(9_999_999))
  })

  test('lists accounts a page at a time, newest first', async ({ assert }) => {
    const created = await UserFactory.createMany(3)

    const page = await userService.getAllUsers(1)
    const rows = page as unknown as { all(): User[]; perPage: number }

    assert.equal(rows.perPage, 10)

    const ids = rows.all().map((user) => user.id)
    const newest = created.at(-1)!

    assert.include(ids, newest.id)
    assert.isAtMost(ids.length, 10)
  })
})

test.group('UserService | writing accounts', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates an account in the role it was asked for', async ({ assert }) => {
    const phone = uniquePhone()

    const user = await userService.createAccount({
      name: 'Petugas Baru',
      phone,
      password: USER_PASSWORD,
      role: Role.STAFF,
    })

    assert.equal(user.role, Role.STAFF)
    assert.equal(user.phone, phone)
    assert.isTrue(await hash.verify(user.password, USER_PASSWORD))
  })

  test('updates an existing account', async ({ assert }) => {
    const user = await UserFactory.create()
    const phone = uniquePhone()

    await userService.updateAccount(user.id, {
      name: 'Nama Diperbarui',
      phone,
      password: 'sandibaru9',
      role: Role.ADMIN,
    })

    const stored = await User.findOrFail(user.id)

    assert.equal(stored.name, 'Nama Diperbarui')
    assert.equal(stored.phone, phone)
    assert.equal(stored.role, Role.ADMIN)
    assert.isTrue(await hash.verify(stored.password, 'sandibaru9'))
  })

  test('refuses to update an account that does not exist', async ({ assert }) => {
    await assert.rejects(() =>
      userService.updateAccount(9_999_999, {
        name: 'Tidak Ada',
        phone: uniquePhone(),
        password: USER_PASSWORD,
        role: Role.CUSTOMER,
      })
    )
  })
})

import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { Role } from '#enums/role_enum'
import { USER_PASSWORD, UserFactory } from '#database/factories/user_factory'

test.group('Auth in the browser | signing up', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a visitor can create an account and lands signed in', async ({ visit, assert }) => {
    const page = await visit('/signup')

    await page.locator('#name').fill('Pelanggan Peramban')
    await page.locator('#phone').fill('081200001001')
    await page.locator('#password').fill(USER_PASSWORD)
    await page.locator('#passwordConfirmation').fill(USER_PASSWORD)

    await page.getByRole('button', { name: 'Daftar' }).click()
    await page.waitForURL('**/profile')

    const user = await User.findByOrFail('phone', '081200001001')

    assert.equal(user.name, 'Pelanggan Peramban')
    assert.equal(user.role, Role.CUSTOMER)
  })

  test('a mismatched confirmation is shown back on the form', async ({ visit, assert }) => {
    const page = await visit('/signup')

    await page.locator('#name').fill('Pelanggan Peramban')
    await page.locator('#phone').fill('081200001002')
    await page.locator('#password').fill(USER_PASSWORD)
    await page.locator('#passwordConfirmation').fill('sandilain9')

    await page.getByRole('button', { name: 'Daftar' }).click()

    await page.locator('[data-invalid="true"]').first().waitFor()

    assert.isNull(await User.findBy('phone', '081200001002'))
  })
})

test.group('Auth in the browser | signing in and out', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a customer signs in and reaches their profile', async ({ visit }) => {
    const user = await UserFactory.create()

    const page = await visit('/login')

    await page.locator('#phone').fill(user.phone)
    await page.locator('#password').fill(USER_PASSWORD)
    await page.getByRole('button', { name: 'Masuk' }).click()

    await page.waitForURL('**/profile')
    await page.assertPath('/profile')
  })

  test('the wrong password keeps the customer on the sign-in page', async ({ visit }) => {
    const user = await UserFactory.create()

    const page = await visit('/login')

    await page.locator('#phone').fill(user.phone)
    await page.locator('#password').fill('salahsekali9')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await page.locator('[data-invalid="true"]').first().waitFor()
    await page.assertPath('/login')
  })

  test('a signed-in customer is not shown the sign-in page again', async ({
    visit,
    browserContext,
  }) => {
    const user = await UserFactory.create()

    await browserContext.loginAs(user)

    const page = await visit('/login')

    await page.waitForURL('**/profile')
    await page.assertPath('/profile')
  })
})

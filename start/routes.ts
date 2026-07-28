/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'
import { Role } from '#enums/role_enum'
import Order from '#models/order'
import transmit from '@adonisjs/transmit/services/main'
import {
  forgotPasswordLimiter,
  loginLimiter,
  signupLimiter,
  resetPasswordLimiter,
} from '#start/limiter'

router.get('/', [controllers.Home, 'index']).as('home')

transmit.registerRoutes((route) => {
  route.use(middleware.auth())
})

transmit.authorize<{ orderNumber: string }>('orders/:orderNumber', async (ctx, { orderNumber }) => {
  const user = ctx.auth.user
  if (!user) return false

  if (user.role === Role.STAFF) return true

  const order = await Order.query().where('order_number', orderNumber).first()
  return order?.userId === user.id
})

router.post('transaction/callback', [controllers.webhooks.Transaction, 'update'])

router
  .group(() => {
    router.get('signup', [controllers.auth.Signup, 'create'])
    router.post('signup', [controllers.auth.Signup, 'store']).use(signupLimiter)

    router.get('login', [controllers.auth.Session, 'create'])
    router.post('login', [controllers.auth.Session, 'store']).use(loginLimiter)

    router.get('forgot-password', [controllers.auth.PasswordReset, 'create'])
    router
      .post('forgot-password', [controllers.auth.PasswordReset, 'store'])
      .use(forgotPasswordLimiter)

    router.get('reset-password', [controllers.auth.PasswordReset, 'edit'])
    router
      .post('reset-password', [controllers.auth.PasswordReset, 'update'])
      .use(resetPasswordLimiter)
  })
  .use(middleware.guest())

router.post('logout', [controllers.auth.Session, 'destroy']).use(middleware.auth())

router
  .group(() => {
    router.group(() => {
      router.get('profile', [controllers.customer.Profile, 'show'])
      router.put('profile', [controllers.customer.Profile, 'update'])

      router.post('phone', [controllers.customer.Phone, 'store'])
      router.get('phone/verify', [controllers.customer.Phone, 'update'])

      router.put('password', [controllers.customer.Password, 'update'])

      router.get('address', [controllers.customer.Address, 'show'])
      router.get('address/create', [controllers.customer.Address, 'create'])
      router.post('address', [controllers.customer.Address, 'store'])
    })

    router.get('order', [controllers.customer.Order, 'create'])
    router.post('orders', [controllers.customer.Order, 'store'])
    router.get('orders', [controllers.customer.Order, 'index'])
    router.get('orders/:number', [controllers.customer.Order, 'show'])
    router.put('orders/:number', [controllers.customer.Order, 'update'])
    router.get('orders/:number/receipt', [controllers.customer.Order, 'receipt'])

    router.post('orders/:number/transactions', [controllers.customer.Transaction, 'store'])
    router.get('orders/:number/transactions/latest', [controllers.customer.Transaction, 'show'])
  })
  .use([middleware.auth(), middleware.role(Role.CUSTOMER)])
  .as(Role.CUSTOMER)

router
  .group(() => {
    router.group(() => {
      router.get('profile', [controllers.staff.Profile, 'show'])
      router.put('profile', [controllers.staff.Profile, 'update'])

      router.post('phone', [controllers.staff.Phone, 'store'])
      router.get('phone/verify', [controllers.staff.Phone, 'update'])
    })

    router.get('trips', [controllers.staff.Trip, 'index'])
    router
      .get('trips/:number/:type', [controllers.staff.Trip, 'show'])
      .where('type', /^(pickup|delivery)$/)
    router
      .put('trips/:number/:type', [controllers.staff.Trip, 'update'])
      .where('type', /^(pickup|delivery)$/)
    router
      .delete('trips/:number/:type', [controllers.staff.Trip, 'destroy'])
      .where('type', /^(pickup|delivery)$/)

    router.get('inspections/:number', [controllers.staff.Inspection, 'show'])
    router.put('inspections/:number', [controllers.staff.Inspection, 'update'])
    router.delete('inspections/:number', [controllers.staff.Inspection, 'destroy'])

    router.put('cleanings/:number', [controllers.staff.Cleaning, 'update'])

    router.get('orders/create', [controllers.staff.Order, 'create'])
    router.post('orders', [controllers.staff.Order, 'store'])
    router.get('orders/:number/items', [controllers.staff.Order, 'edit'])
    router.put('orders/:number/items', [controllers.staff.Order, 'update'])
    router.get('orders/:number/tag', [controllers.staff.Tag, 'show'])

    router.post('orders/:number/transactions', [controllers.staff.Transaction, 'store'])
    router.get('orders/:number/transactions/latest', [controllers.staff.Transaction, 'show'])
  })
  .use([middleware.auth(), middleware.role(Role.STAFF)])
  .prefix(Role.STAFF)
  .as(Role.STAFF)

router
  .group(() => {
    router.group(() => {
      router.get('profile', [controllers.admin.Profile, 'show'])
      router.put('profile', [controllers.admin.Profile, 'update'])

      router.post('phone', [controllers.admin.Phone, 'store'])
      router.get('phone/verify', [controllers.admin.Phone, 'update'])
    })
    router.get('dashboard', [controllers.admin.Dashboard, 'index'])
    router.get('dashboard/export', [controllers.admin.Dashboard, 'export'])

    router.get('orders', [controllers.admin.Order, 'index'])
    /**
     * Registered ahead of `orders/:number`, which would otherwise match first
     * and go looking for an order numbered "export".
     */
    router.get('orders/export', [controllers.admin.Order, 'export'])
    router.get('orders/:number', [controllers.admin.Order, 'show'])

    router.get('services', [controllers.admin.Service, 'index'])
    router.get('services/export', [controllers.admin.Service, 'export'])
    router.get('services/create', [controllers.admin.Service, 'create'])
    router.post('services', [controllers.admin.Service, 'store'])
    router.get('services/:id/edit', [controllers.admin.Service, 'edit'])
    router.put('services/:id', [controllers.admin.Service, 'update'])
    router.delete('services/:id', [controllers.admin.Service, 'destroy'])

    router.get('users', [controllers.admin.User, 'index'])
    router.get('users/export', [controllers.admin.User, 'export'])
    router.get('users/create', [controllers.admin.User, 'create'])
    router.post('users', [controllers.admin.User, 'store'])
    router.get('users/:id/edit', [controllers.admin.User, 'edit'])
    router.put('users/:id', [controllers.admin.User, 'update'])
    router.delete('users/:id', [controllers.admin.User, 'destroy'])

    router.get('reports', [controllers.admin.Report, 'index'])
    router.get('reports/export', [controllers.admin.Report, 'export'])

    router.get('reconciliations', [controllers.admin.Reconciliation, 'index'])
    router.get('reconciliations/export', [controllers.admin.Reconciliation, 'export'])
    router.put('reconciliations/:number', [controllers.admin.Reconciliation, 'update'])
  })
  .use([middleware.auth(), middleware.role(Role.ADMIN)])
  .prefix(Role.ADMIN)
  .as(Role.ADMIN)

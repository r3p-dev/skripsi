import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'
import { Role } from '#enums/role_enum'
import AdminChannelPolicy from '#policies/admin_channel_policy'
import OrderPolicy from '#policies/order_policy'
import transmit from '@adonisjs/transmit/services/main'
import { ADMIN_ORDERS_CHANNEL } from '#services/order_service'
import {
  geocodeLimiter,
  loginLimiter,
  paymentLimiter,
  signupLimiter,
  resetPasswordLimiter,
} from '#start/limiter'

router.get('robots.txt', [controllers.Seo, 'robots']).as('robots')
router.get('sitemap.xml', [controllers.Seo, 'sitemap']).as('sitemap')

transmit.registerRoutes((route) => {
  route.use(middleware.auth())
})

transmit.authorize(ADMIN_ORDERS_CHANNEL, async (ctx) =>
  ctx.bouncer.with(AdminChannelPolicy).allows('subscribe')
)

transmit.authorize<{ orderNumber: string }>('orders/:orderNumber', async (ctx, { orderNumber }) =>
  ctx.bouncer.with(OrderPolicy).allows('subscribe', orderNumber)
)

router.post('transaction/callback', [controllers.webhooks.Transaction, 'update'])

router
  .group(() => {
    router.get('/', [controllers.Home, 'index']).as('home')

    router.get('signup', [controllers.auth.Signup, 'create'])
    router.post('signup', [controllers.auth.Signup, 'store']).use(signupLimiter)

    router.get('internal/login', [controllers.auth.Session, 'createInternal'])
    router.get('login', [controllers.auth.Session, 'create'])
    router.post('login', [controllers.auth.Session, 'store']).use(loginLimiter)

    router.get('forgot-password', [controllers.auth.PasswordReset, 'create'])
    router.post('forgot-password', [controllers.auth.PasswordReset, 'store'])

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

      router
        .get('address/geocode', [controllers.customer.Geocode, 'show'])
        .as('address.geocode')
        .use(geocodeLimiter)

      router
        .get('address/nearby', [controllers.customer.Geocode, 'nearby'])
        .as('address.nearby')
        .use(geocodeLimiter)

      router.get('address', [controllers.customer.Address, 'show']).as('address.show')
      router.get('address/create', [controllers.customer.Address, 'create']).as('address.create')
      router.post('address', [controllers.customer.Address, 'store']).as('address.store')

      router
        .get('orders/:number/receipt', [controllers.customer.Order, 'receipt'])
        .as('orders.receipt')

      router
        .get('orders/:number/payment', [controllers.customer.Transaction, 'show'])
        .as('transaction.show')

      router
        .post('orders/:number/payment', [controllers.customer.Transaction, 'store'])
        .as('transaction.store')
        .use(paymentLimiter)

      router.resource('orders', controllers.customer.Order).except(['edit', 'update']).params({
        orders: 'number',
      })
    })
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

      router.get('tasks', [controllers.staff.Trip, 'index']).as('trip.index')

      router.get('tasks/:number/trip/:type', [controllers.staff.Trip, 'show']).as('trip.show')
      router
        .post('tasks/:number/trip/:type/claim', [controllers.staff.Trip, 'claim'])
        .as('trip.claim')
      router.post('tasks/:number/trip/:type', [controllers.staff.Trip, 'update']).as('trip.update')
      router
        .delete('tasks/:number/trip/:type', [controllers.staff.Trip, 'destroy'])
        .as('trip.destroy')

      router
        .get('tasks/:number/inspection', [controllers.staff.Inspection, 'show'])
        .as('inspection.show')
      router
        .post('tasks/:number/inspection/claim', [controllers.staff.Inspection, 'claim'])
        .as('inspection.claim')
      router
        .post('tasks/:number/inspection', [controllers.staff.Inspection, 'update'])
        .as('inspection.update')
      router
        .delete('tasks/:number/inspection', [controllers.staff.Inspection, 'destroy'])
        .as('inspection.destroy')

      router
        .post('tasks/:number/cleaning', [controllers.staff.Cleaning, 'update'])
        .as('cleaning.update')

      router
        .post('tasks/:number/collection', [controllers.staff.Collection, 'update'])
        .as('collection.update')

      router.get('tasks/:number/tag', [controllers.staff.Tag, 'show']).as('tag.show')

      router.get('customers', [controllers.staff.Order, 'customers']).as('customers.index')

      router.get('orders/create', [controllers.staff.Order, 'create']).as('order.create')
      router.post('orders', [controllers.staff.Order, 'store']).as('order.store')
      router.get('orders/:number/edit', [controllers.staff.Order, 'edit']).as('order.edit')
      router.put('orders/:number', [controllers.staff.Order, 'update']).as('order.update')
      router.get('orders/:number/receipt', [controllers.staff.Order, 'receipt']).as('order.receipt')
    })
  })
  .use([middleware.auth(), middleware.role(Role.STAFF)])
  .prefix(Role.STAFF)
  .as(Role.STAFF)

router
  .get('internal/actions/:id/photo', [controllers.internal.ActionPhoto, 'show'])
  .as('internal.action.photo')
  .use([middleware.auth(), middleware.role([Role.STAFF, Role.ADMIN])])

router
  .group(() => {
    router.group(() => {
      router.get('profile', [controllers.admin.Profile, 'show'])
      router.put('profile', [controllers.admin.Profile, 'update'])

      router.post('phone', [controllers.admin.Phone, 'store'])
      router.get('phone/verify', [controllers.admin.Phone, 'update'])

      router.get('/', [controllers.admin.Dashboard, 'index']).as('dashboard.index')

      router.get('orders/export', [controllers.admin.Order, 'export']).as('order.export')
      router.get('orders', [controllers.admin.Order, 'index']).as('order.index')
      router.get('orders/:number', [controllers.admin.Order, 'show']).as('order.show')

      router
        .get('reconciliation', [controllers.admin.Reconciliation, 'index'])
        .as('reconciliation.index')
      router
        .post('reconciliation/:number', [controllers.admin.Reconciliation, 'update'])
        .as('reconciliation.update')

      router.get('catalogues', [controllers.admin.Catalogue, 'index']).as('catalogue.index')
      router
        .get('catalogues/create', [controllers.admin.Catalogue, 'create'])
        .as('catalogue.create')
      router.post('catalogues', [controllers.admin.Catalogue, 'store']).as('catalogue.store')
      router.get('catalogues/:id/edit', [controllers.admin.Catalogue, 'edit']).as('catalogue.edit')
      router.put('catalogues/:id', [controllers.admin.Catalogue, 'update']).as('catalogue.update')
      router
        .delete('catalogues/:id', [controllers.admin.Catalogue, 'destroy'])
        .as('catalogue.destroy')

      router.get('users', [controllers.admin.User, 'index']).as('user.index')
      router.get('users/create', [controllers.admin.User, 'create']).as('user.create')
      router.post('users', [controllers.admin.User, 'store']).as('user.store')
      router.get('users/:id/edit', [controllers.admin.User, 'edit']).as('user.edit')
      router.put('users/:id', [controllers.admin.User, 'update']).as('user.update')
      router.delete('users/:id', [controllers.admin.User, 'destroy']).as('user.destroy')

      router.get('reports/export', [controllers.admin.Report, 'export']).as('report.export')
      router.get('reports', [controllers.admin.Report, 'index']).as('report.index')
    })
  })
  .use([middleware.auth(), middleware.role(Role.ADMIN)])
  .prefix(Role.ADMIN)
  .as(Role.ADMIN)

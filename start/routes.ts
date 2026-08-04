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
import { appUrl } from '#config/app'
import { Role } from '#enums/role_enum'
import Order from '#models/order'
import transmit from '@adonisjs/transmit/services/main'
import { ADMIN_ORDERS_CHANNEL } from '#services/broadcast_service'
import {
  forgotPasswordLimiter,
  loginLimiter,
  paymentLimiter,
  signupLimiter,
  resetPasswordLimiter,
} from '#start/limiter'

router.get('/', [controllers.Home, 'index']).as('home')

/**
 * The landing page is the only thing here worth indexing. Everything else is
 * either behind auth or a form that produces nothing a search result could use,
 * and the order routes carry an order number in the path — crawling those is
 * how private URLs end up in a search index.
 *
 * Both files are served from routes rather than `public/` so the absolute URLs
 * inside them follow APP_URL instead of being hardcoded per environment.
 */
router
  .get('robots.txt', ({ response }) => {
    return response.type('text/plain').send(
      [
        'User-agent: *',
        'Disallow: /admin',
        'Disallow: /staff',
        // Prefix match, so this covers /orders and /orders/:number too.
        'Disallow: /order',
        'Disallow: /profile',
        'Disallow: /address',
        'Disallow: /login',
        'Disallow: /signup',
        'Disallow: /forgot-password',
        'Disallow: /reset-password',
        '',
        `Sitemap: ${appUrl}/sitemap.xml`,
      ].join('\n')
    )
  })
  .as('robots')

router
  .get('sitemap.xml', ({ response }) => {
    return response
      .type('application/xml')
      .send(
        [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          '  <url>',
          `    <loc>${appUrl}/</loc>`,
          '    <changefreq>weekly</changefreq>',
          '    <priority>1.0</priority>',
          '  </url>',
          '</urlset>',
        ].join('\n')
      )
  })
  .as('sitemap')

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

/**
 * The shop-wide order feed, for administrators only. It carries every order
 * that arrives, moves, or gets paid for, which is the whole business — not
 * something a customer or a staff member has any reason to subscribe to.
 */
transmit.authorize(ADMIN_ORDERS_CHANNEL, async (ctx) => {
  return ctx.auth.user?.role === Role.ADMIN
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

    /**
     * Asking to pay is rate limited as well as the charge behind it. The
     * charge limiter is per order and only counts requests that actually reach
     * Midtrans, which leaves one account free to spray requests across many
     * orders at once without any single order noticing.
     */
    router
      .post('orders/:number/transactions', [controllers.customer.Transaction, 'store'])
      .use(paymentLimiter)
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

    /**
     * Handing a washed walk-in order back over the counter. Separate from
     * cleaning because the two are genuinely different moments: one is the
     * shoes being finished, the other is somebody actually taking them home.
     */
    router.put('collections/:number', [controllers.staff.Collection, 'update'])

    router.get('customers', [controllers.staff.Customer, 'index'])

    router.get('orders/create', [controllers.staff.Order, 'create'])
    router.post('orders', [controllers.staff.Order, 'store'])
    router.get('orders/:number/items', [controllers.staff.Order, 'edit'])
    router.put('orders/:number/items', [controllers.staff.Order, 'update'])
    router.get('orders/:number/tag', [controllers.staff.Tag, 'show'])
    router.get('orders/:number/receipt', [controllers.staff.Order, 'receipt'])

    router.post('orders/:number/notifications', [controllers.staff.Notification, 'store'])

    router
      .post('orders/:number/transactions', [controllers.staff.Transaction, 'store'])
      .use(paymentLimiter)
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

    /**
     * Registration for the people who work here. There is no public route to
     * a staff or admin account by design, so this is the one that exists, and
     * it sits inside the admin area behind the admin role.
     */
    router.get('signup', [controllers.admin.Signup, 'create'])
    router.post('signup', [controllers.admin.Signup, 'store']).use(signupLimiter)

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

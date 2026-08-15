import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'
import { appUrl } from '#config/app'
import { Role } from '#enums/role_enum'
import Order from '#models/order'
import transmit from '@adonisjs/transmit/services/main'
import {
  forgotPasswordLimiter,
  geocodeLimiter,
  loginLimiter,
  paymentLimiter,
  signupLimiter,
  resetPasswordLimiter,
} from '#start/limiter'

router
  .get('robots.txt', ({ response }) => {
    return response
      .type('text/plain')
      .send(
        [
          'User-agent: *',
          'Disallow: /admin',
          'Disallow: /staff',
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

      router.resource('orders', controllers.customer.Order).except(['edit', 'destroy']).params({
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
      router.post('tasks/:number/trip/:type', [controllers.staff.Trip, 'update']).as('trip.update')
      router
        .delete('tasks/:number/trip/:type', [controllers.staff.Trip, 'destroy'])
        .as('trip.destroy')

      router
        .get('tasks/:number/inspection', [controllers.staff.Inspection, 'show'])
        .as('inspection.show')
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

      router
        .post('tasks/:number/notification', [controllers.staff.Notification, 'store'])
        .as('notification.store')

      router.get('tasks/:number/tag', [controllers.staff.Tag, 'show']).as('tag.show')
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
    })
  })
  .use([middleware.auth(), middleware.role(Role.ADMIN)])
  .prefix(Role.ADMIN)
  .as(Role.ADMIN)

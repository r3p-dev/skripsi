import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'
import { Role } from '#models/user'

router
  .group(() => {
    router.on('/').renderInertia('home', {}).as('home')

    router.get('register', [controllers.auth.Register, 'create'])
    router.post('register', [controllers.auth.Register, 'store'])

    router.get('login', [controllers.auth.Session, 'create'])
    router.post('login', [controllers.auth.Session, 'store'])

    router.get('forgot-password', [controllers.auth.ForgotPassword, 'create'])
    router.post('forgot-password', [controllers.auth.ForgotPassword, 'store'])

    router.get('reset-password', [controllers.auth.ResetPassword, 'create'])
    router.post('reset-password', [controllers.auth.ResetPassword, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.auth.Session, 'destroy'])

    router.get('/transactions/full-payment/:number', [controllers.transaction.FullPayment, 'show'])
    router.post('/transactions/full-payment/:number', [
      controllers.transaction.FullPayment,
      'store',
    ])
  })
  .use(middleware.auth())

router
  .group(() => {
    router.get('/profile', [controllers.customer.Profile, 'show'])
    router.post('/profile', [controllers.customer.Profile, 'update'])

    router.get('/address', [controllers.customer.Address, 'show'])
    router.post('/address', [controllers.customer.Address, 'update'])

    router.get('/orders', [controllers.customer.Order, 'index'])
    router.get('/orders/create', [controllers.customer.Order, 'create'])
    router.post('/orders', [controllers.customer.Order, 'store'])
    router.get('/orders/:number', [controllers.customer.Order, 'show'])

    router.get('/transactions/down-payment/:number', [controllers.transaction.DownPayment, 'show'])
    router.post('/transactions/down-payment/:number', [
      controllers.transaction.DownPayment,
      'store',
    ])
  })
  .use([middleware.auth(), middleware.role(Role.CUSTOMER)])

router
  .group(() => {
    router.get('/tasks', [controllers.staff.Task, 'index'])
  })
  .use([middleware.auth(), middleware.role(Role.STAFF)])

router
  .group(() => {
    router.get('/dashboard', [controllers.admin.Dashboard, 'index'])
  })
  .use([middleware.auth(), middleware.role(Role.ADMIN)])

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

router.get('/', [controllers.Home, 'show']).as('home').use(middleware.guest())

router
  .group(() => {
    router.get('signup', [controllers.auth.Signup, 'create'])
    router.post('signup', [controllers.auth.Signup, 'store'])

    router.get('login', [controllers.auth.Session, 'create'])
    router.post('login', [controllers.auth.Session, 'store'])

    router.get('forgot-password', [controllers.auth.PasswordReset, 'create'])
    router.post('forgot-password', [controllers.auth.PasswordReset, 'store'])

    router.get('reset-password', [controllers.auth.PasswordReset, 'edit'])
    router.post('reset-password', [controllers.auth.PasswordReset, 'update'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.auth.Session, 'destroy'])
  })
  .use(middleware.auth())

router
  .group(() => {
    router.get('profile', [controllers.customer.Profile, 'show'])
    router.put('profile', [controllers.customer.Profile, 'update'])

    router.get('address', [controllers.customer.Address, 'show'])
    router.get('address/create', [controllers.customer.Address, 'create'])
    router.post('address', [controllers.customer.Address, 'store'])

    router.get('orders/create', [controllers.customer.Order, 'create'])
    router.post('orders', [controllers.customer.Order, 'store'])
    router.get('orders', [controllers.customer.Order, 'index'])
    router.get('orders/:number', [controllers.customer.Order, 'show'])
  })
  .use([middleware.auth(), middleware.role(Role.CUSTOMER)])
  .as(Role.CUSTOMER)

router
  .group(() => {
    router.get('profile', [controllers.staff.Profile, 'show'])

    router.get('tasks', [controllers.staff.Task, 'index'])
    router.get('tasks/:numbber', [controllers.staff.Task, 'create'])

    router.get('offline-order', [controllers.staff.OfflineOrder, 'create'])
  })
  .use([middleware.auth(), middleware.role(Role.STAFF)])
  .prefix(Role.STAFF)
  .as(Role.STAFF)

router
  .group(() => {
    router.get('profile', [controllers.admin.Profile, 'show'])

    router.get('dashboard', [controllers.admin.Dashboard, 'index'])
  })
  .use([middleware.auth(), middleware.role(Role.ADMIN)])
  .prefix(Role.ADMIN)
  .as(Role.ADMIN)

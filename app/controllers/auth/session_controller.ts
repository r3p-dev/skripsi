import User, { Role } from '#models/user'
import { loginLimiter } from '#start/limiter'
import { loginValidator } from '#validators/user_validator'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async store({ request, auth, response, session, logger }: HttpContext) {
    const payload = await request.validateUsing(loginValidator)

    const key = `login_${request.ip()}_${payload.phone}`
    const [errors, user] = await loginLimiter.penalize(key, async () => {
      return User.verifyCredentials(payload.phone, payload.password)
    })
    if (errors) {
      logger.error(`Login failed for phone: ${payload.phone} from IP: ${request.ip()}`)
      session.flash('error', 'Terlalu banyak percobaan login. Silakan coba lagi nanti.')
      return response.redirect().toRoute('session.create')
    }

    await auth.use('web').login(user, !!payload.remember_me)

    const RoleRedirect = {
      [Role.CUSTOMER]: 'order.create',
      [Role.STAFF]: 'task.index',
      [Role.ADMIN]: 'dashboard.index',
    } as const

    session.flash('success', 'Berhasil masuk!')

    return response.redirect().toRoute(RoleRedirect[user.role as Role])
  }

  async destroy({ auth, response, session }: HttpContext) {
    await auth.use('web').logout()

    session.flash('success', 'Berhasil keluar!')

    return response.redirect().toRoute('session.create')
  }
}

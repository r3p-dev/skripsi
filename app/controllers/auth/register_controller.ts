import User from '#models/user'
import { registerLimiter } from '#start/limiter'
import { registerValidator } from '#validators/user_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { errors as vineErrors } from '@vinejs/vine'

export default class RegisterController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/register', {})
  }

  async store({ request, response, auth, session, logger }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)

    const key = `register_${request.ip()}_${payload.phone}`
    const [errors, user] = await registerLimiter.penalize(key, async () => {
      const existing = await User.query().where('phone', payload.phone).first()
      if (existing && existing.isRegistered) {
        throw new vineErrors.E_VALIDATION_ERROR([
          {
            field: 'phone',
            message: 'Nomor ini sudah terdaftar. Silakan masuk atau gunakan nomor lain.',
          },
        ])
      }

      if (existing && !existing.isRegistered) {
        await existing
          .merge({ name: payload.name, password: payload.password, isRegistered: true })
          .save()
        return existing
      }

      return User.create(payload)
    })
    if (errors) {
      logger.error(`Registration failed for phone: ${payload.phone} from IP: ${request.ip()}`)
      session.flash('error', 'Terlalu banyak percobaan registrasi. Silakan coba lagi nanti.')
      return response.redirect().toRoute('register.create')
    }

    await auth.use('web').login(user)

    session.flash('success', 'Berhasil mendaftar!')

    return response.redirect().toRoute('profile.show')
  }
}

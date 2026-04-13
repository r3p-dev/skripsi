import User from '#models/user'
import { resetPasswordValidator } from '#validators/user_validator'
import type { HttpContext } from '@adonisjs/core/http'

export default class ResetPasswordController {
  async create({ inertia, request }: HttpContext) {
    if (!request.hasValidSignature()) {
      return inertia.render('errors/invalid-token', {})
    }

    return inertia.render('auth/reset-password', {})
  }

  async store({ request, response, session }: HttpContext) {
    if (!request.hasValidSignature()) {
      return response.redirect().toRoute('session.create')
    }

    const payload = await request.validateUsing(resetPasswordValidator)
    const phone = request.qs().phone

    const user = await User.query().where('phone', phone).firstOrFail()
    await user.merge({ password: payload.password }).save()

    session.flash('success', 'Kata sandi berhasil direset!')

    return response.redirect().toRoute('session.create')
  }
}

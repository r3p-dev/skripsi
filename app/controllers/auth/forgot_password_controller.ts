import User from '#models/user'
import { forgotPasswordValidator } from '#validators/user_validator'
import type { HttpContext } from '@adonisjs/core/http'

export default class ForgotPasswordController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/forgot-password', {})
  }

  async store({ request }: HttpContext) {
    const payload = await request.validateUsing(forgotPasswordValidator)

    const user = await User.query().where('phone', payload.phone).first()
    if (user) {
      // TODO: Send OTP to user's phone number
    }
  }
}

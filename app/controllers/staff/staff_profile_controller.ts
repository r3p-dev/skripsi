import { updatePasswordValidator } from '#validators/profile_validator'
import type { HttpContext } from '@adonisjs/core/http'

export default class StaffProfileController {
  async show({ inertia }: HttpContext) {
    return inertia.render('staff/profile', {})
  }

  async update({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updatePasswordValidator)

    await user.validatePassword(payload.current_password, 'current_password')
    await user.merge({ password: payload.password }).save()

    return response.redirect().back()
  }
}

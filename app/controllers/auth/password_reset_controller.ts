import AuthService from '#services/auth_service'
import { forgotPasswordValidator, resetPasswordValidator } from '#validators/auth_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class PasswordResetController {
  constructor(protected authService: AuthService) {}

  async create({ inertia }: HttpContext) {
    return inertia.render('auth/forgot_password', {})
  }

  async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(forgotPasswordValidator)

    try {
      await this.authService.requestPasswordReset(payload)

      session.flash(
        'success',
        'Jika akun dengan nomor telepon tersebut ada, tautan atur ulang kata sandi telah dikirim melalui WhatsApp.'
      )
    } catch (error) {
      session.flash(
        'error',
        error instanceof Error ? error.message : 'Gagal mengirim pesan WhatsApp.'
      )
    }

    return response.redirect().back()
  }

  async edit({ request, inertia }: HttpContext) {
    const phone = request.qs().phone as string
    if (!request.hasValidSignature() || !phone) {
      return inertia.render('errors/invalid_signature', {})
    }

    return inertia.render('auth/reset_password', {})
  }

  async update({ request, response, inertia, session }: HttpContext) {
    const phone = request.qs().phone as string
    if (!request.hasValidSignature() || !phone) {
      return inertia.render('errors/invalid_signature', {})
    }

    const payload = await request.validateUsing(resetPasswordValidator)

    await this.authService.resetPassword(payload, phone)

    session.flash(
      'success',
      'Kata sandi berhasil diubah. Silakan masuk dengan kata sandi baru Anda.'
    )
    return response.redirect().toRoute('session.create')
  }
}

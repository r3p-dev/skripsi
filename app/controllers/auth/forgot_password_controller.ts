import { appUrl } from '#config/app'
import User from '#models/user'
import env from '#start/env'
import { forgotPasswordValidator } from '#validators/user_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'

interface FonnteResponse {
  status: boolean
  reason?: string
  detail?: string
  id?: string[]
  process?: string
  requestid?: number
  target?: string[]
}

export default class ForgotPasswordController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/forgot-password', {})
  }

  async store({ request, response, logger, session }: HttpContext) {
    const payload = await request.validateUsing(forgotPasswordValidator)

    const user = await User.query().where('phone', payload.phone).first()

    try {
      if (user) {
        const resetUrl = signedUrlFor(
          'reset_password.create',
          { phone: user.phone },
          {
            expiresIn: '15m',
            prefixUrl: appUrl,
          }
        )

        const res = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': env.get('FONNTE_API_KEY'),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: user.phone,
            message: `Halo ${user.name}\n\nTautan reset password kamu: ${resetUrl}\n\nTautan hanya berlaku selama 15 menit\n\nJika kamu tidak meminta reset password, abaikan pesan ini.`,
          }),
        })

        const data = (await res.json()) as FonnteResponse

        if (!res.ok || !data.status) {
          throw new Error(data?.reason || 'Unknown error')
        }
      }

      return response.redirect().back()
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Send WA Error:', error.message)
      } else {
        logger.error('Send WA Error:', error)
      }

      session.flash('error', 'Gagal mengirim pesan reset password. Silakan coba lagi nanti.')
      return response.redirect().back()
    }
  }
}

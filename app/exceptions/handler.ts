import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'
import { errors as authErrors } from '@adonisjs/auth'
import { errors as vineErrors } from '@vinejs/vine'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  protected renderStatusPages = app.inProduction

  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (_, { inertia }) => inertia.render('errors/not_found', {}),
    '500..599': (_, { inertia }) => inertia.render('errors/server_error', {}),
  }

  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'phone',
          message: 'Nomor telepon atau kata sandi salah.',
        },
        {
          field: 'password',
          message: 'Nomor telepon atau kata sandi salah.',
        },
      ])
    }

    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}

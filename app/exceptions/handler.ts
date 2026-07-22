import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'

type ErrorWithCode = {
  code: string
  status: number
  messages: unknown
}

const ERROR_MESSAGES: Record<string, string> = {
  E_TOO_MANY_REQUESTS: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
  E_BAD_CSRF_TOKEN: 'Token CSRF tidak valid.',
  E_UNAUTHORIZED_ACCESS: 'Anda harus login terlebih dahulu.',
  E_AUTHORIZATION_FAILURE: 'Anda tidak memiliki izin untuk mengakses sumber daya ini.',
  E_INVALID_CREDENTIALS: 'Nomor telepon atau kata sandi salah.',
  E_ROUTE_NOT_FOUND: 'Halaman tidak ditemukan.',
  E_ROW_NOT_FOUND: 'Data tidak ditemukan.',
  E_INVALID_SESSION: 'Sesi tidak valid atau telah berakhir.',
  E_REQUEST_ABORTED: 'Permintaan dibatalkan.',
  E_HTTP_REQUEST_ABORTED: 'Permintaan dibatalkan.',
  E_HTTP_EXCEPTION: 'Terjadi kesalahan pada permintaan.',
}

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * Status pages are used to display a custom HTML pages for certain error
   * codes. You might want to enable them in production only, but feel
   * free to enable them in development as well.
   */
  protected renderStatusPages = app.inProduction

  /**
   * Status pages is a collection of error code range and a callback
   * to return the HTML contents to send as a response.
   */
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (_, { inertia }) => inertia.render('errors/not_found', {}),
    '500..599': (_, { inertia }) => inertia.render('errors/server_error', {}),
  }

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    const normalizedError = error as ErrorWithCode
    const message = normalizedError.code ? ERROR_MESSAGES[normalizedError.code] : undefined

    if (message && !normalizedError.messages) {
      return ctx.response.status(normalizedError.status ?? 500).send({ message })
    }

    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}

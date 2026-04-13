import { I18n } from '@adonisjs/i18n'
import i18nManager from '@adonisjs/i18n/services/main'
import type { NextFn } from '@adonisjs/core/types/http'
import { type HttpContext, RequestValidator } from '@adonisjs/core/http'

export default class DetectUserLocaleMiddleware {
  static {
    RequestValidator.messagesProvider = (ctx) => {
      return ctx.i18n.createMessagesProvider()
    }
  }

  protected getRequestLocale(ctx: HttpContext) {
    const userLanguages = ctx.request.languages()
    return i18nManager.getSupportedLocaleFor(userLanguages)
  }

  async handle(ctx: HttpContext, next: NextFn) {
    const language = this.getRequestLocale(ctx)

    ctx.i18n = i18nManager.locale(language || i18nManager.defaultLocale)

    ctx.containerResolver.bindValue(I18n, ctx.i18n)

    if ('view' in ctx) {
      ctx.view.share({ i18n: ctx.i18n })
    }

    return next()
  }
}

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    i18n: I18n
  }
}

import limiter from '@adonisjs/limiter/services/main'
import { errors } from '@vinejs/vine'

export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(10).every('1 minute')
})

export const signupLimiter = limiter.define('signup', (ctx) => {
  return limiter
    .allowRequests(10)
    .every('1 minute')
    .blockFor('10 minute')
    .usingKey(`signup:${ctx.request.ip()}`)
    .limitExceeded(() => {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'form',
          message: 'Terlalu banyak percobaan pendaftaran. Silakan coba lagi nanti.',
        },
      ])
    })
})

export const loginLimiter = limiter.define('login', (ctx) => {
  return limiter
    .allowRequests(5)
    .every('1 minute')
    .blockFor('5 minute')
    .usingKey(`login:${ctx.request.ip()}:${ctx.request.input('phone')}`)
    .limitExceeded(() => {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'form',
          message: 'Terlalu banyak percobaan masuk. Silakan coba lagi nanti.',
        },
      ])
    })
})

export const forgotPasswordLimiter = limiter.define('forgot-password', (ctx) => {
  return limiter
    .allowRequests(1)
    .every('15 minutes')
    .blockFor('15 minute')
    .usingKey(`forgot-password:${ctx.request.ip()}`)
    .limitExceeded(() => {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'form',
          message:
            'Terlalu banyak percobaan permintaan tautan atur ulang kata sandi. Silakan coba lagi nanti.',
        },
      ])
    })
})

export const resetPasswordLimiter = limiter.define('reset-password', (ctx) => {
  return limiter
    .allowRequests(5)
    .every('15 minutes')
    .blockFor('15 minute')
    .usingKey(`reset-password:${ctx.request.ip()}:${ctx.request.url()}`)
    .limitExceeded(() => {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'form',
          message: 'Terlalu banyak percobaan atur ulang kata sandi. Silakan coba lagi nanti.',
        },
      ])
    })
})

export const paymentLimiter = limiter.define('payment', (ctx) => {
  return limiter
    .allowRequests(15)
    .every('5 minutes')
    .blockFor('5 minutes')
    .usingKey(`payment:${ctx.auth.user?.id ?? ctx.request.ip()}`)
    .limitExceeded(() => {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'form',
          message: 'Terlalu banyak permintaan pembayaran. Silakan coba lagi nanti.',
        },
      ])
    })
})

export const geocodeLimiter = limiter.define('geocode', (ctx) => {
  return limiter
    .allowRequests(30)
    .every('1 minute')
    .blockFor('1 minute')
    .usingKey(`geocode:${ctx.auth.user?.id ?? ctx.request.ip()}`)
    .limitExceeded(() => {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'query',
          message: 'Terlalu banyak pencarian lokasi. Silakan coba lagi nanti.',
        },
      ])
    })
})

export const midtransChargeLimiter = limiter.use({
  requests: 5,
  duration: '15 minutes',
  blockDuration: '15 minutes',
})

/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

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

/**
 * Caps how often one signed-in person may ask to pay for anything.
 *
 * The per-order limit below protects Midtrans from a loop on a single order.
 * This protects the shop from someone spraying payment requests across many
 * orders at once, which that limit cannot see: each individual order is well
 * inside its own budget while the provider is being hammered all the same.
 *
 * The allowance is generous, because a customer legitimately retries — the QR
 * expired, they closed the tab, the bank app failed — and a staff member at
 * the counter serves one walk-in after another.
 */
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

/**
 * Caps how often a single order may be charged at Midtrans.
 *
 * Applied around the charge itself rather than on the route, because asking to
 * pay usually returns the existing pending QR without contacting Midtrans at
 * all — only a genuinely new charge should count against the limit.
 *
 * The allowance leaves room for legitimate retries after a QR expires or a
 * payment fails, while stopping a loop from hammering the provider.
 */
export const midtransChargeLimiter = limiter.use({
  requests: 5,
  duration: '15 minutes',
  blockDuration: '15 minutes',
})

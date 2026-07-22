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

/**
 * Global fallback limiter for generic requests.
 */
export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(10).every('1 minute')
})

/**
 * Limit registration attempts by IP address.
 */
export const registerLimiter = limiter.define('auth-register', (ctx) => {
  return limiter
    .allowRequests(10)
    .every('1 minute')
    .blockFor('10 minutes')
    .usingKey(ctx.request.ip())
})

/**
 * Limit login attempts by IP and submitted phone number.
 */
export const loginLimiter = limiter.define('auth-login', (ctx) => {
  const phone = String(ctx.request.input('phone', 'guest'))

  return limiter
    .allowRequests(5)
    .every('1 minute')
    .blockFor('5 minutes')
    .usingKey(`${ctx.request.ip()}:${phone}`)
})

/**
 * Limit password reset link requests to prevent WhatsApp abuse.
 */
export const forgotPasswordLimiter = limiter.define('auth-forgot-password', (ctx) => {
  const phone = String(ctx.request.input('phone', 'guest'))

  return limiter
    .allowRequests(3)
    .every('15 minutes')
    .blockFor('30 minutes')
    .usingKey(`${ctx.request.ip()}:${phone}`)
})

/**
 * Limit reset token validation and password reset submissions.
 */
export const resetPasswordLimiter = limiter.define('auth-reset-password', (ctx) => {
  return limiter
    .allowRequests(10)
    .every('15 minutes')
    .blockFor('15 minutes')
    .usingKey(ctx.request.ip())
})

/**
 * Limit payment requests to prevent abuse.
 */
export const paymentLimiter = limiter.use({
  requests: 1,
  duration: '15 min',
})

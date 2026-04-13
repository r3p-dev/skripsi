import limiter from '@adonisjs/limiter/services/main'

export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(10).every('1 minute')
})

export const registerLimiter = limiter.use({
  requests: 10,
  duration: '1 min',
  blockDuration: '10 min',
})

export const loginLimiter = limiter.use({
  requests: 5,
  duration: '1 min',
  blockDuration: '5 min',
})

export const paymentLimiter = limiter.use({
  requests: 1,
  duration: '15 min',
})

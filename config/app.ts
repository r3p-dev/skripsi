import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/core/http'
import proxyAddr from 'proxy-addr'

export const appUrl = env.get('APP_URL')

export const http = defineConfig({
  trustProxy: proxyAddr.compile(['loopback', 'uniquelocal']),

  generateRequestId: true,

  allowMethodSpoofing: false,

  useAsyncLocalStorage: false,

  redirect: {
    forwardQueryString: true,
  },

  cookie: {
    domain: '',

    path: '/',

    maxAge: '2h',

    httpOnly: true,

    secure: app.inProduction,

    sameSite: 'lax',
  },
})

export const shop = {
  latitude: -6.9555305,
  longitude: 107.6540353,
} as const

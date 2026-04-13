/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'drive.fs.serve': {
    methods: ["GET","HEAD"],
    pattern: '/uploads/*',
    tokens: [{"old":"/uploads/*","type":0,"val":"uploads","end":""},{"old":"/uploads/*","type":2,"val":"*","end":""}],
    types: placeholder as Registry['drive.fs.serve']['types'],
  },
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'register.create': {
    methods: ["GET","HEAD"],
    pattern: '/register',
    tokens: [{"old":"/register","type":0,"val":"register","end":""}],
    types: placeholder as Registry['register.create']['types'],
  },
  'register.store': {
    methods: ["POST"],
    pattern: '/register',
    tokens: [{"old":"/register","type":0,"val":"register","end":""}],
    types: placeholder as Registry['register.store']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.store']['types'],
  },
  'forgot_password.create': {
    methods: ["GET","HEAD"],
    pattern: '/forgot-password',
    tokens: [{"old":"/forgot-password","type":0,"val":"forgot-password","end":""}],
    types: placeholder as Registry['forgot_password.create']['types'],
  },
  'forgot_password.store': {
    methods: ["POST"],
    pattern: '/forgot-password',
    tokens: [{"old":"/forgot-password","type":0,"val":"forgot-password","end":""}],
    types: placeholder as Registry['forgot_password.store']['types'],
  },
  'reset_password.create': {
    methods: ["GET","HEAD"],
    pattern: '/reset-password',
    tokens: [{"old":"/reset-password","type":0,"val":"reset-password","end":""}],
    types: placeholder as Registry['reset_password.create']['types'],
  },
  'reset_password.store': {
    methods: ["POST"],
    pattern: '/reset-password',
    tokens: [{"old":"/reset-password","type":0,"val":"reset-password","end":""}],
    types: placeholder as Registry['reset_password.store']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'full_payment.show': {
    methods: ["GET","HEAD"],
    pattern: '/transactions/full-payment/:number',
    tokens: [{"old":"/transactions/full-payment/:number","type":0,"val":"transactions","end":""},{"old":"/transactions/full-payment/:number","type":0,"val":"full-payment","end":""},{"old":"/transactions/full-payment/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['full_payment.show']['types'],
  },
  'full_payment.store': {
    methods: ["POST"],
    pattern: '/transactions/full-payment/:number',
    tokens: [{"old":"/transactions/full-payment/:number","type":0,"val":"transactions","end":""},{"old":"/transactions/full-payment/:number","type":0,"val":"full-payment","end":""},{"old":"/transactions/full-payment/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['full_payment.store']['types'],
  },
  'profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/profile',
    tokens: [{"old":"/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.show']['types'],
  },
  'profile.update': {
    methods: ["POST"],
    pattern: '/profile',
    tokens: [{"old":"/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.update']['types'],
  },
  'address.show': {
    methods: ["GET","HEAD"],
    pattern: '/address',
    tokens: [{"old":"/address","type":0,"val":"address","end":""}],
    types: placeholder as Registry['address.show']['types'],
  },
  'address.update': {
    methods: ["POST"],
    pattern: '/address',
    tokens: [{"old":"/address","type":0,"val":"address","end":""}],
    types: placeholder as Registry['address.update']['types'],
  },
  'order.index': {
    methods: ["GET","HEAD"],
    pattern: '/orders',
    tokens: [{"old":"/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['order.index']['types'],
  },
  'order.create': {
    methods: ["GET","HEAD"],
    pattern: '/orders/create',
    tokens: [{"old":"/orders/create","type":0,"val":"orders","end":""},{"old":"/orders/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['order.create']['types'],
  },
  'order.store': {
    methods: ["POST"],
    pattern: '/orders',
    tokens: [{"old":"/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['order.store']['types'],
  },
  'order.show': {
    methods: ["GET","HEAD"],
    pattern: '/orders/:number',
    tokens: [{"old":"/orders/:number","type":0,"val":"orders","end":""},{"old":"/orders/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['order.show']['types'],
  },
  'down_payment.show': {
    methods: ["GET","HEAD"],
    pattern: '/transactions/down-payment/:number',
    tokens: [{"old":"/transactions/down-payment/:number","type":0,"val":"transactions","end":""},{"old":"/transactions/down-payment/:number","type":0,"val":"down-payment","end":""},{"old":"/transactions/down-payment/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['down_payment.show']['types'],
  },
  'down_payment.store': {
    methods: ["POST"],
    pattern: '/transactions/down-payment/:number',
    tokens: [{"old":"/transactions/down-payment/:number","type":0,"val":"transactions","end":""},{"old":"/transactions/down-payment/:number","type":0,"val":"down-payment","end":""},{"old":"/transactions/down-payment/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['down_payment.store']['types'],
  },
  'task.index': {
    methods: ["GET","HEAD"],
    pattern: '/tasks',
    tokens: [{"old":"/tasks","type":0,"val":"tasks","end":""}],
    types: placeholder as Registry['task.index']['types'],
  },
  'dashboard.index': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard',
    tokens: [{"old":"/dashboard","type":0,"val":"dashboard","end":""}],
    types: placeholder as Registry['dashboard.index']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}

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
  'robots': {
    methods: ["GET","HEAD"],
    pattern: '/robots.txt',
    tokens: [{"old":"/robots.txt","type":0,"val":"robots.txt","end":""}],
    types: placeholder as Registry['robots']['types'],
  },
  'sitemap': {
    methods: ["GET","HEAD"],
    pattern: '/sitemap.xml',
    tokens: [{"old":"/sitemap.xml","type":0,"val":"sitemap.xml","end":""}],
    types: placeholder as Registry['sitemap']['types'],
  },
  'event_stream': {
    methods: ["GET","HEAD"],
    pattern: '/__transmit/events',
    tokens: [{"old":"/__transmit/events","type":0,"val":"__transmit","end":""},{"old":"/__transmit/events","type":0,"val":"events","end":""}],
    types: placeholder as Registry['event_stream']['types'],
  },
  'subscribe': {
    methods: ["POST"],
    pattern: '/__transmit/subscribe',
    tokens: [{"old":"/__transmit/subscribe","type":0,"val":"__transmit","end":""},{"old":"/__transmit/subscribe","type":0,"val":"subscribe","end":""}],
    types: placeholder as Registry['subscribe']['types'],
  },
  'unsubscribe': {
    methods: ["POST"],
    pattern: '/__transmit/unsubscribe',
    tokens: [{"old":"/__transmit/unsubscribe","type":0,"val":"__transmit","end":""},{"old":"/__transmit/unsubscribe","type":0,"val":"unsubscribe","end":""}],
    types: placeholder as Registry['unsubscribe']['types'],
  },
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'transaction.update': {
    methods: ["POST"],
    pattern: '/transaction/callback',
    tokens: [{"old":"/transaction/callback","type":0,"val":"transaction","end":""},{"old":"/transaction/callback","type":0,"val":"callback","end":""}],
    types: placeholder as Registry['transaction.update']['types'],
  },
  'signup.create': {
    methods: ["GET","HEAD"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['signup.create']['types'],
  },
  'signup.store': {
    methods: ["POST"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['signup.store']['types'],
  },
  'session.create_internal': {
    methods: ["GET","HEAD"],
    pattern: '/internal/login',
    tokens: [{"old":"/internal/login","type":0,"val":"internal","end":""},{"old":"/internal/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.create_internal']['types'],
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
  'password_reset.create': {
    methods: ["GET","HEAD"],
    pattern: '/forgot-password',
    tokens: [{"old":"/forgot-password","type":0,"val":"forgot-password","end":""}],
    types: placeholder as Registry['password_reset.create']['types'],
  },
  'password_reset.store': {
    methods: ["POST"],
    pattern: '/forgot-password',
    tokens: [{"old":"/forgot-password","type":0,"val":"forgot-password","end":""}],
    types: placeholder as Registry['password_reset.store']['types'],
  },
  'password_reset.edit': {
    methods: ["GET","HEAD"],
    pattern: '/reset-password',
    tokens: [{"old":"/reset-password","type":0,"val":"reset-password","end":""}],
    types: placeholder as Registry['password_reset.edit']['types'],
  },
  'password_reset.update': {
    methods: ["POST"],
    pattern: '/reset-password',
    tokens: [{"old":"/reset-password","type":0,"val":"reset-password","end":""}],
    types: placeholder as Registry['password_reset.update']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'customer.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/profile',
    tokens: [{"old":"/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['customer.profile.show']['types'],
  },
  'customer.profile.update': {
    methods: ["PUT"],
    pattern: '/profile',
    tokens: [{"old":"/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['customer.profile.update']['types'],
  },
  'customer.phone.store': {
    methods: ["POST"],
    pattern: '/phone',
    tokens: [{"old":"/phone","type":0,"val":"phone","end":""}],
    types: placeholder as Registry['customer.phone.store']['types'],
  },
  'customer.phone.update': {
    methods: ["GET","HEAD"],
    pattern: '/phone/verify',
    tokens: [{"old":"/phone/verify","type":0,"val":"phone","end":""},{"old":"/phone/verify","type":0,"val":"verify","end":""}],
    types: placeholder as Registry['customer.phone.update']['types'],
  },
  'customer.password.update': {
    methods: ["PUT"],
    pattern: '/password',
    tokens: [{"old":"/password","type":0,"val":"password","end":""}],
    types: placeholder as Registry['customer.password.update']['types'],
  },
  'customer.address.geocode': {
    methods: ["GET","HEAD"],
    pattern: '/address/geocode',
    tokens: [{"old":"/address/geocode","type":0,"val":"address","end":""},{"old":"/address/geocode","type":0,"val":"geocode","end":""}],
    types: placeholder as Registry['customer.address.geocode']['types'],
  },
  'customer.address.nearby': {
    methods: ["GET","HEAD"],
    pattern: '/address/nearby',
    tokens: [{"old":"/address/nearby","type":0,"val":"address","end":""},{"old":"/address/nearby","type":0,"val":"nearby","end":""}],
    types: placeholder as Registry['customer.address.nearby']['types'],
  },
  'customer.address.show': {
    methods: ["GET","HEAD"],
    pattern: '/address',
    tokens: [{"old":"/address","type":0,"val":"address","end":""}],
    types: placeholder as Registry['customer.address.show']['types'],
  },
  'customer.address.create': {
    methods: ["GET","HEAD"],
    pattern: '/address/create',
    tokens: [{"old":"/address/create","type":0,"val":"address","end":""},{"old":"/address/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['customer.address.create']['types'],
  },
  'customer.address.store': {
    methods: ["POST"],
    pattern: '/address',
    tokens: [{"old":"/address","type":0,"val":"address","end":""}],
    types: placeholder as Registry['customer.address.store']['types'],
  },
  'customer.orders.index': {
    methods: ["GET","HEAD"],
    pattern: '/orders',
    tokens: [{"old":"/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['customer.orders.index']['types'],
  },
  'customer.orders.create': {
    methods: ["GET","HEAD"],
    pattern: '/orders/create',
    tokens: [{"old":"/orders/create","type":0,"val":"orders","end":""},{"old":"/orders/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['customer.orders.create']['types'],
  },
  'staff.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/staff/profile',
    tokens: [{"old":"/staff/profile","type":0,"val":"staff","end":""},{"old":"/staff/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['staff.profile.show']['types'],
  },
  'staff.profile.update': {
    methods: ["PUT"],
    pattern: '/staff/profile',
    tokens: [{"old":"/staff/profile","type":0,"val":"staff","end":""},{"old":"/staff/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['staff.profile.update']['types'],
  },
  'staff.phone.store': {
    methods: ["POST"],
    pattern: '/staff/phone',
    tokens: [{"old":"/staff/phone","type":0,"val":"staff","end":""},{"old":"/staff/phone","type":0,"val":"phone","end":""}],
    types: placeholder as Registry['staff.phone.store']['types'],
  },
  'staff.phone.update': {
    methods: ["GET","HEAD"],
    pattern: '/staff/phone/verify',
    tokens: [{"old":"/staff/phone/verify","type":0,"val":"staff","end":""},{"old":"/staff/phone/verify","type":0,"val":"phone","end":""},{"old":"/staff/phone/verify","type":0,"val":"verify","end":""}],
    types: placeholder as Registry['staff.phone.update']['types'],
  },
  'admin.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/admin/profile',
    tokens: [{"old":"/admin/profile","type":0,"val":"admin","end":""},{"old":"/admin/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['admin.profile.show']['types'],
  },
  'admin.profile.update': {
    methods: ["PUT"],
    pattern: '/admin/profile',
    tokens: [{"old":"/admin/profile","type":0,"val":"admin","end":""},{"old":"/admin/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['admin.profile.update']['types'],
  },
  'admin.phone.store': {
    methods: ["POST"],
    pattern: '/admin/phone',
    tokens: [{"old":"/admin/phone","type":0,"val":"admin","end":""},{"old":"/admin/phone","type":0,"val":"phone","end":""}],
    types: placeholder as Registry['admin.phone.store']['types'],
  },
  'admin.phone.update': {
    methods: ["GET","HEAD"],
    pattern: '/admin/phone/verify',
    tokens: [{"old":"/admin/phone/verify","type":0,"val":"admin","end":""},{"old":"/admin/phone/verify","type":0,"val":"phone","end":""},{"old":"/admin/phone/verify","type":0,"val":"verify","end":""}],
    types: placeholder as Registry['admin.phone.update']['types'],
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

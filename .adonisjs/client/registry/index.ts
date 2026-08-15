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
  'transaction.update': {
    methods: ["POST"],
    pattern: '/transaction/callback',
    tokens: [{"old":"/transaction/callback","type":0,"val":"transaction","end":""},{"old":"/transaction/callback","type":0,"val":"callback","end":""}],
    types: placeholder as Registry['transaction.update']['types'],
  },
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
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
  'customer.orders.receipt': {
    methods: ["GET","HEAD"],
    pattern: '/orders/:number/receipt',
    tokens: [{"old":"/orders/:number/receipt","type":0,"val":"orders","end":""},{"old":"/orders/:number/receipt","type":1,"val":"number","end":""},{"old":"/orders/:number/receipt","type":0,"val":"receipt","end":""}],
    types: placeholder as Registry['customer.orders.receipt']['types'],
  },
  'customer.transaction.show': {
    methods: ["GET","HEAD"],
    pattern: '/orders/:number/payment',
    tokens: [{"old":"/orders/:number/payment","type":0,"val":"orders","end":""},{"old":"/orders/:number/payment","type":1,"val":"number","end":""},{"old":"/orders/:number/payment","type":0,"val":"payment","end":""}],
    types: placeholder as Registry['customer.transaction.show']['types'],
  },
  'customer.transaction.store': {
    methods: ["POST"],
    pattern: '/orders/:number/payment',
    tokens: [{"old":"/orders/:number/payment","type":0,"val":"orders","end":""},{"old":"/orders/:number/payment","type":1,"val":"number","end":""},{"old":"/orders/:number/payment","type":0,"val":"payment","end":""}],
    types: placeholder as Registry['customer.transaction.store']['types'],
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
  'customer.orders.store': {
    methods: ["POST"],
    pattern: '/orders',
    tokens: [{"old":"/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['customer.orders.store']['types'],
  },
  'customer.orders.show': {
    methods: ["GET","HEAD"],
    pattern: '/orders/:number',
    tokens: [{"old":"/orders/:number","type":0,"val":"orders","end":""},{"old":"/orders/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['customer.orders.show']['types'],
  },
  'customer.orders.update': {
    methods: ["PUT","PATCH"],
    pattern: '/orders/:number',
    tokens: [{"old":"/orders/:number","type":0,"val":"orders","end":""},{"old":"/orders/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['customer.orders.update']['types'],
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
  'staff.trip.index': {
    methods: ["GET","HEAD"],
    pattern: '/staff/tasks',
    tokens: [{"old":"/staff/tasks","type":0,"val":"staff","end":""},{"old":"/staff/tasks","type":0,"val":"tasks","end":""}],
    types: placeholder as Registry['staff.trip.index']['types'],
  },
  'staff.trip.show': {
    methods: ["GET","HEAD"],
    pattern: '/staff/tasks/:number/trip/:type',
    tokens: [{"old":"/staff/tasks/:number/trip/:type","type":0,"val":"staff","end":""},{"old":"/staff/tasks/:number/trip/:type","type":0,"val":"tasks","end":""},{"old":"/staff/tasks/:number/trip/:type","type":1,"val":"number","end":""},{"old":"/staff/tasks/:number/trip/:type","type":0,"val":"trip","end":""},{"old":"/staff/tasks/:number/trip/:type","type":1,"val":"type","end":""}],
    types: placeholder as Registry['staff.trip.show']['types'],
  },
  'staff.trip.update': {
    methods: ["POST"],
    pattern: '/staff/tasks/:number/trip/:type',
    tokens: [{"old":"/staff/tasks/:number/trip/:type","type":0,"val":"staff","end":""},{"old":"/staff/tasks/:number/trip/:type","type":0,"val":"tasks","end":""},{"old":"/staff/tasks/:number/trip/:type","type":1,"val":"number","end":""},{"old":"/staff/tasks/:number/trip/:type","type":0,"val":"trip","end":""},{"old":"/staff/tasks/:number/trip/:type","type":1,"val":"type","end":""}],
    types: placeholder as Registry['staff.trip.update']['types'],
  },
  'staff.trip.destroy': {
    methods: ["DELETE"],
    pattern: '/staff/tasks/:number/trip/:type',
    tokens: [{"old":"/staff/tasks/:number/trip/:type","type":0,"val":"staff","end":""},{"old":"/staff/tasks/:number/trip/:type","type":0,"val":"tasks","end":""},{"old":"/staff/tasks/:number/trip/:type","type":1,"val":"number","end":""},{"old":"/staff/tasks/:number/trip/:type","type":0,"val":"trip","end":""},{"old":"/staff/tasks/:number/trip/:type","type":1,"val":"type","end":""}],
    types: placeholder as Registry['staff.trip.destroy']['types'],
  },
  'staff.inspection.show': {
    methods: ["GET","HEAD"],
    pattern: '/staff/tasks/:number/inspection',
    tokens: [{"old":"/staff/tasks/:number/inspection","type":0,"val":"staff","end":""},{"old":"/staff/tasks/:number/inspection","type":0,"val":"tasks","end":""},{"old":"/staff/tasks/:number/inspection","type":1,"val":"number","end":""},{"old":"/staff/tasks/:number/inspection","type":0,"val":"inspection","end":""}],
    types: placeholder as Registry['staff.inspection.show']['types'],
  },
  'staff.inspection.update': {
    methods: ["POST"],
    pattern: '/staff/tasks/:number/inspection',
    tokens: [{"old":"/staff/tasks/:number/inspection","type":0,"val":"staff","end":""},{"old":"/staff/tasks/:number/inspection","type":0,"val":"tasks","end":""},{"old":"/staff/tasks/:number/inspection","type":1,"val":"number","end":""},{"old":"/staff/tasks/:number/inspection","type":0,"val":"inspection","end":""}],
    types: placeholder as Registry['staff.inspection.update']['types'],
  },
  'staff.inspection.destroy': {
    methods: ["DELETE"],
    pattern: '/staff/tasks/:number/inspection',
    tokens: [{"old":"/staff/tasks/:number/inspection","type":0,"val":"staff","end":""},{"old":"/staff/tasks/:number/inspection","type":0,"val":"tasks","end":""},{"old":"/staff/tasks/:number/inspection","type":1,"val":"number","end":""},{"old":"/staff/tasks/:number/inspection","type":0,"val":"inspection","end":""}],
    types: placeholder as Registry['staff.inspection.destroy']['types'],
  },
  'staff.cleaning.update': {
    methods: ["POST"],
    pattern: '/staff/tasks/:number/cleaning',
    tokens: [{"old":"/staff/tasks/:number/cleaning","type":0,"val":"staff","end":""},{"old":"/staff/tasks/:number/cleaning","type":0,"val":"tasks","end":""},{"old":"/staff/tasks/:number/cleaning","type":1,"val":"number","end":""},{"old":"/staff/tasks/:number/cleaning","type":0,"val":"cleaning","end":""}],
    types: placeholder as Registry['staff.cleaning.update']['types'],
  },
  'staff.collection.update': {
    methods: ["POST"],
    pattern: '/staff/tasks/:number/collection',
    tokens: [{"old":"/staff/tasks/:number/collection","type":0,"val":"staff","end":""},{"old":"/staff/tasks/:number/collection","type":0,"val":"tasks","end":""},{"old":"/staff/tasks/:number/collection","type":1,"val":"number","end":""},{"old":"/staff/tasks/:number/collection","type":0,"val":"collection","end":""}],
    types: placeholder as Registry['staff.collection.update']['types'],
  },
  'staff.notification.store': {
    methods: ["POST"],
    pattern: '/staff/tasks/:number/notification',
    tokens: [{"old":"/staff/tasks/:number/notification","type":0,"val":"staff","end":""},{"old":"/staff/tasks/:number/notification","type":0,"val":"tasks","end":""},{"old":"/staff/tasks/:number/notification","type":1,"val":"number","end":""},{"old":"/staff/tasks/:number/notification","type":0,"val":"notification","end":""}],
    types: placeholder as Registry['staff.notification.store']['types'],
  },
  'staff.tag.show': {
    methods: ["GET","HEAD"],
    pattern: '/staff/tasks/:number/tag',
    tokens: [{"old":"/staff/tasks/:number/tag","type":0,"val":"staff","end":""},{"old":"/staff/tasks/:number/tag","type":0,"val":"tasks","end":""},{"old":"/staff/tasks/:number/tag","type":1,"val":"number","end":""},{"old":"/staff/tasks/:number/tag","type":0,"val":"tag","end":""}],
    types: placeholder as Registry['staff.tag.show']['types'],
  },
  'internal.action.photo': {
    methods: ["GET","HEAD"],
    pattern: '/internal/actions/:id/photo',
    tokens: [{"old":"/internal/actions/:id/photo","type":0,"val":"internal","end":""},{"old":"/internal/actions/:id/photo","type":0,"val":"actions","end":""},{"old":"/internal/actions/:id/photo","type":1,"val":"id","end":""},{"old":"/internal/actions/:id/photo","type":0,"val":"photo","end":""}],
    types: placeholder as Registry['internal.action.photo']['types'],
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

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
  'customer.order.create': {
    methods: ["GET","HEAD"],
    pattern: '/order',
    tokens: [{"old":"/order","type":0,"val":"order","end":""}],
    types: placeholder as Registry['customer.order.create']['types'],
  },
  'customer.order.store': {
    methods: ["POST"],
    pattern: '/orders',
    tokens: [{"old":"/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['customer.order.store']['types'],
  },
  'customer.order.index': {
    methods: ["GET","HEAD"],
    pattern: '/orders',
    tokens: [{"old":"/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['customer.order.index']['types'],
  },
  'customer.order.show': {
    methods: ["GET","HEAD"],
    pattern: '/orders/:number',
    tokens: [{"old":"/orders/:number","type":0,"val":"orders","end":""},{"old":"/orders/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['customer.order.show']['types'],
  },
  'customer.order.update': {
    methods: ["PUT"],
    pattern: '/orders/:number',
    tokens: [{"old":"/orders/:number","type":0,"val":"orders","end":""},{"old":"/orders/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['customer.order.update']['types'],
  },
  'customer.order.receipt': {
    methods: ["GET","HEAD"],
    pattern: '/orders/:number/receipt',
    tokens: [{"old":"/orders/:number/receipt","type":0,"val":"orders","end":""},{"old":"/orders/:number/receipt","type":1,"val":"number","end":""},{"old":"/orders/:number/receipt","type":0,"val":"receipt","end":""}],
    types: placeholder as Registry['customer.order.receipt']['types'],
  },
  'customer.transaction.store': {
    methods: ["POST"],
    pattern: '/orders/:number/transactions',
    tokens: [{"old":"/orders/:number/transactions","type":0,"val":"orders","end":""},{"old":"/orders/:number/transactions","type":1,"val":"number","end":""},{"old":"/orders/:number/transactions","type":0,"val":"transactions","end":""}],
    types: placeholder as Registry['customer.transaction.store']['types'],
  },
  'customer.transaction.show': {
    methods: ["GET","HEAD"],
    pattern: '/orders/:number/transactions/latest',
    tokens: [{"old":"/orders/:number/transactions/latest","type":0,"val":"orders","end":""},{"old":"/orders/:number/transactions/latest","type":1,"val":"number","end":""},{"old":"/orders/:number/transactions/latest","type":0,"val":"transactions","end":""},{"old":"/orders/:number/transactions/latest","type":0,"val":"latest","end":""}],
    types: placeholder as Registry['customer.transaction.show']['types'],
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
    pattern: '/staff/trips',
    tokens: [{"old":"/staff/trips","type":0,"val":"staff","end":""},{"old":"/staff/trips","type":0,"val":"trips","end":""}],
    types: placeholder as Registry['staff.trip.index']['types'],
  },
  'staff.trip.show': {
    methods: ["GET","HEAD"],
    pattern: '/staff/trips/:number/:type',
    tokens: [{"old":"/staff/trips/:number/:type","type":0,"val":"staff","end":""},{"old":"/staff/trips/:number/:type","type":0,"val":"trips","end":""},{"old":"/staff/trips/:number/:type","type":1,"val":"number","end":""},{"old":"/staff/trips/:number/:type","type":1,"val":"type","end":""}],
    types: placeholder as Registry['staff.trip.show']['types'],
  },
  'staff.trip.update': {
    methods: ["PUT"],
    pattern: '/staff/trips/:number/:type',
    tokens: [{"old":"/staff/trips/:number/:type","type":0,"val":"staff","end":""},{"old":"/staff/trips/:number/:type","type":0,"val":"trips","end":""},{"old":"/staff/trips/:number/:type","type":1,"val":"number","end":""},{"old":"/staff/trips/:number/:type","type":1,"val":"type","end":""}],
    types: placeholder as Registry['staff.trip.update']['types'],
  },
  'staff.trip.destroy': {
    methods: ["DELETE"],
    pattern: '/staff/trips/:number/:type',
    tokens: [{"old":"/staff/trips/:number/:type","type":0,"val":"staff","end":""},{"old":"/staff/trips/:number/:type","type":0,"val":"trips","end":""},{"old":"/staff/trips/:number/:type","type":1,"val":"number","end":""},{"old":"/staff/trips/:number/:type","type":1,"val":"type","end":""}],
    types: placeholder as Registry['staff.trip.destroy']['types'],
  },
  'staff.inspection.show': {
    methods: ["GET","HEAD"],
    pattern: '/staff/inspections/:number',
    tokens: [{"old":"/staff/inspections/:number","type":0,"val":"staff","end":""},{"old":"/staff/inspections/:number","type":0,"val":"inspections","end":""},{"old":"/staff/inspections/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['staff.inspection.show']['types'],
  },
  'staff.inspection.update': {
    methods: ["PUT"],
    pattern: '/staff/inspections/:number',
    tokens: [{"old":"/staff/inspections/:number","type":0,"val":"staff","end":""},{"old":"/staff/inspections/:number","type":0,"val":"inspections","end":""},{"old":"/staff/inspections/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['staff.inspection.update']['types'],
  },
  'staff.inspection.destroy': {
    methods: ["DELETE"],
    pattern: '/staff/inspections/:number',
    tokens: [{"old":"/staff/inspections/:number","type":0,"val":"staff","end":""},{"old":"/staff/inspections/:number","type":0,"val":"inspections","end":""},{"old":"/staff/inspections/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['staff.inspection.destroy']['types'],
  },
  'staff.cleaning.update': {
    methods: ["PUT"],
    pattern: '/staff/cleanings/:number',
    tokens: [{"old":"/staff/cleanings/:number","type":0,"val":"staff","end":""},{"old":"/staff/cleanings/:number","type":0,"val":"cleanings","end":""},{"old":"/staff/cleanings/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['staff.cleaning.update']['types'],
  },
  'staff.collection.update': {
    methods: ["PUT"],
    pattern: '/staff/collections/:number',
    tokens: [{"old":"/staff/collections/:number","type":0,"val":"staff","end":""},{"old":"/staff/collections/:number","type":0,"val":"collections","end":""},{"old":"/staff/collections/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['staff.collection.update']['types'],
  },
  'staff.customer.index': {
    methods: ["GET","HEAD"],
    pattern: '/staff/customers',
    tokens: [{"old":"/staff/customers","type":0,"val":"staff","end":""},{"old":"/staff/customers","type":0,"val":"customers","end":""}],
    types: placeholder as Registry['staff.customer.index']['types'],
  },
  'staff.order.create': {
    methods: ["GET","HEAD"],
    pattern: '/staff/orders/create',
    tokens: [{"old":"/staff/orders/create","type":0,"val":"staff","end":""},{"old":"/staff/orders/create","type":0,"val":"orders","end":""},{"old":"/staff/orders/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['staff.order.create']['types'],
  },
  'staff.order.store': {
    methods: ["POST"],
    pattern: '/staff/orders',
    tokens: [{"old":"/staff/orders","type":0,"val":"staff","end":""},{"old":"/staff/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['staff.order.store']['types'],
  },
  'staff.order.edit': {
    methods: ["GET","HEAD"],
    pattern: '/staff/orders/:number/items',
    tokens: [{"old":"/staff/orders/:number/items","type":0,"val":"staff","end":""},{"old":"/staff/orders/:number/items","type":0,"val":"orders","end":""},{"old":"/staff/orders/:number/items","type":1,"val":"number","end":""},{"old":"/staff/orders/:number/items","type":0,"val":"items","end":""}],
    types: placeholder as Registry['staff.order.edit']['types'],
  },
  'staff.order.update': {
    methods: ["PUT"],
    pattern: '/staff/orders/:number/items',
    tokens: [{"old":"/staff/orders/:number/items","type":0,"val":"staff","end":""},{"old":"/staff/orders/:number/items","type":0,"val":"orders","end":""},{"old":"/staff/orders/:number/items","type":1,"val":"number","end":""},{"old":"/staff/orders/:number/items","type":0,"val":"items","end":""}],
    types: placeholder as Registry['staff.order.update']['types'],
  },
  'staff.tag.show': {
    methods: ["GET","HEAD"],
    pattern: '/staff/orders/:number/tag',
    tokens: [{"old":"/staff/orders/:number/tag","type":0,"val":"staff","end":""},{"old":"/staff/orders/:number/tag","type":0,"val":"orders","end":""},{"old":"/staff/orders/:number/tag","type":1,"val":"number","end":""},{"old":"/staff/orders/:number/tag","type":0,"val":"tag","end":""}],
    types: placeholder as Registry['staff.tag.show']['types'],
  },
  'staff.order.receipt': {
    methods: ["GET","HEAD"],
    pattern: '/staff/orders/:number/receipt',
    tokens: [{"old":"/staff/orders/:number/receipt","type":0,"val":"staff","end":""},{"old":"/staff/orders/:number/receipt","type":0,"val":"orders","end":""},{"old":"/staff/orders/:number/receipt","type":1,"val":"number","end":""},{"old":"/staff/orders/:number/receipt","type":0,"val":"receipt","end":""}],
    types: placeholder as Registry['staff.order.receipt']['types'],
  },
  'staff.notification.store': {
    methods: ["POST"],
    pattern: '/staff/orders/:number/notifications',
    tokens: [{"old":"/staff/orders/:number/notifications","type":0,"val":"staff","end":""},{"old":"/staff/orders/:number/notifications","type":0,"val":"orders","end":""},{"old":"/staff/orders/:number/notifications","type":1,"val":"number","end":""},{"old":"/staff/orders/:number/notifications","type":0,"val":"notifications","end":""}],
    types: placeholder as Registry['staff.notification.store']['types'],
  },
  'staff.transaction.store': {
    methods: ["POST"],
    pattern: '/staff/orders/:number/transactions',
    tokens: [{"old":"/staff/orders/:number/transactions","type":0,"val":"staff","end":""},{"old":"/staff/orders/:number/transactions","type":0,"val":"orders","end":""},{"old":"/staff/orders/:number/transactions","type":1,"val":"number","end":""},{"old":"/staff/orders/:number/transactions","type":0,"val":"transactions","end":""}],
    types: placeholder as Registry['staff.transaction.store']['types'],
  },
  'staff.transaction.show': {
    methods: ["GET","HEAD"],
    pattern: '/staff/orders/:number/transactions/latest',
    tokens: [{"old":"/staff/orders/:number/transactions/latest","type":0,"val":"staff","end":""},{"old":"/staff/orders/:number/transactions/latest","type":0,"val":"orders","end":""},{"old":"/staff/orders/:number/transactions/latest","type":1,"val":"number","end":""},{"old":"/staff/orders/:number/transactions/latest","type":0,"val":"transactions","end":""},{"old":"/staff/orders/:number/transactions/latest","type":0,"val":"latest","end":""}],
    types: placeholder as Registry['staff.transaction.show']['types'],
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
  'admin.dashboard.index': {
    methods: ["GET","HEAD"],
    pattern: '/admin/dashboard',
    tokens: [{"old":"/admin/dashboard","type":0,"val":"admin","end":""},{"old":"/admin/dashboard","type":0,"val":"dashboard","end":""}],
    types: placeholder as Registry['admin.dashboard.index']['types'],
  },
  'admin.dashboard.export': {
    methods: ["GET","HEAD"],
    pattern: '/admin/dashboard/export',
    tokens: [{"old":"/admin/dashboard/export","type":0,"val":"admin","end":""},{"old":"/admin/dashboard/export","type":0,"val":"dashboard","end":""},{"old":"/admin/dashboard/export","type":0,"val":"export","end":""}],
    types: placeholder as Registry['admin.dashboard.export']['types'],
  },
  'admin.order.index': {
    methods: ["GET","HEAD"],
    pattern: '/admin/orders',
    tokens: [{"old":"/admin/orders","type":0,"val":"admin","end":""},{"old":"/admin/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['admin.order.index']['types'],
  },
  'admin.order.export': {
    methods: ["GET","HEAD"],
    pattern: '/admin/orders/export',
    tokens: [{"old":"/admin/orders/export","type":0,"val":"admin","end":""},{"old":"/admin/orders/export","type":0,"val":"orders","end":""},{"old":"/admin/orders/export","type":0,"val":"export","end":""}],
    types: placeholder as Registry['admin.order.export']['types'],
  },
  'admin.order.show': {
    methods: ["GET","HEAD"],
    pattern: '/admin/orders/:number',
    tokens: [{"old":"/admin/orders/:number","type":0,"val":"admin","end":""},{"old":"/admin/orders/:number","type":0,"val":"orders","end":""},{"old":"/admin/orders/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['admin.order.show']['types'],
  },
  'admin.service.index': {
    methods: ["GET","HEAD"],
    pattern: '/admin/services',
    tokens: [{"old":"/admin/services","type":0,"val":"admin","end":""},{"old":"/admin/services","type":0,"val":"services","end":""}],
    types: placeholder as Registry['admin.service.index']['types'],
  },
  'admin.service.export': {
    methods: ["GET","HEAD"],
    pattern: '/admin/services/export',
    tokens: [{"old":"/admin/services/export","type":0,"val":"admin","end":""},{"old":"/admin/services/export","type":0,"val":"services","end":""},{"old":"/admin/services/export","type":0,"val":"export","end":""}],
    types: placeholder as Registry['admin.service.export']['types'],
  },
  'admin.service.create': {
    methods: ["GET","HEAD"],
    pattern: '/admin/services/create',
    tokens: [{"old":"/admin/services/create","type":0,"val":"admin","end":""},{"old":"/admin/services/create","type":0,"val":"services","end":""},{"old":"/admin/services/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['admin.service.create']['types'],
  },
  'admin.service.store': {
    methods: ["POST"],
    pattern: '/admin/services',
    tokens: [{"old":"/admin/services","type":0,"val":"admin","end":""},{"old":"/admin/services","type":0,"val":"services","end":""}],
    types: placeholder as Registry['admin.service.store']['types'],
  },
  'admin.service.edit': {
    methods: ["GET","HEAD"],
    pattern: '/admin/services/:id/edit',
    tokens: [{"old":"/admin/services/:id/edit","type":0,"val":"admin","end":""},{"old":"/admin/services/:id/edit","type":0,"val":"services","end":""},{"old":"/admin/services/:id/edit","type":1,"val":"id","end":""},{"old":"/admin/services/:id/edit","type":0,"val":"edit","end":""}],
    types: placeholder as Registry['admin.service.edit']['types'],
  },
  'admin.service.update': {
    methods: ["PUT"],
    pattern: '/admin/services/:id',
    tokens: [{"old":"/admin/services/:id","type":0,"val":"admin","end":""},{"old":"/admin/services/:id","type":0,"val":"services","end":""},{"old":"/admin/services/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.service.update']['types'],
  },
  'admin.service.destroy': {
    methods: ["DELETE"],
    pattern: '/admin/services/:id',
    tokens: [{"old":"/admin/services/:id","type":0,"val":"admin","end":""},{"old":"/admin/services/:id","type":0,"val":"services","end":""},{"old":"/admin/services/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.service.destroy']['types'],
  },
  'admin.user.index': {
    methods: ["GET","HEAD"],
    pattern: '/admin/users',
    tokens: [{"old":"/admin/users","type":0,"val":"admin","end":""},{"old":"/admin/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['admin.user.index']['types'],
  },
  'admin.user.export': {
    methods: ["GET","HEAD"],
    pattern: '/admin/users/export',
    tokens: [{"old":"/admin/users/export","type":0,"val":"admin","end":""},{"old":"/admin/users/export","type":0,"val":"users","end":""},{"old":"/admin/users/export","type":0,"val":"export","end":""}],
    types: placeholder as Registry['admin.user.export']['types'],
  },
  'admin.user.create': {
    methods: ["GET","HEAD"],
    pattern: '/admin/users/create',
    tokens: [{"old":"/admin/users/create","type":0,"val":"admin","end":""},{"old":"/admin/users/create","type":0,"val":"users","end":""},{"old":"/admin/users/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['admin.user.create']['types'],
  },
  'admin.user.store': {
    methods: ["POST"],
    pattern: '/admin/users',
    tokens: [{"old":"/admin/users","type":0,"val":"admin","end":""},{"old":"/admin/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['admin.user.store']['types'],
  },
  'admin.user.edit': {
    methods: ["GET","HEAD"],
    pattern: '/admin/users/:id/edit',
    tokens: [{"old":"/admin/users/:id/edit","type":0,"val":"admin","end":""},{"old":"/admin/users/:id/edit","type":0,"val":"users","end":""},{"old":"/admin/users/:id/edit","type":1,"val":"id","end":""},{"old":"/admin/users/:id/edit","type":0,"val":"edit","end":""}],
    types: placeholder as Registry['admin.user.edit']['types'],
  },
  'admin.user.update': {
    methods: ["PUT"],
    pattern: '/admin/users/:id',
    tokens: [{"old":"/admin/users/:id","type":0,"val":"admin","end":""},{"old":"/admin/users/:id","type":0,"val":"users","end":""},{"old":"/admin/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.user.update']['types'],
  },
  'admin.user.destroy': {
    methods: ["DELETE"],
    pattern: '/admin/users/:id',
    tokens: [{"old":"/admin/users/:id","type":0,"val":"admin","end":""},{"old":"/admin/users/:id","type":0,"val":"users","end":""},{"old":"/admin/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.user.destroy']['types'],
  },
  'admin.report.index': {
    methods: ["GET","HEAD"],
    pattern: '/admin/reports',
    tokens: [{"old":"/admin/reports","type":0,"val":"admin","end":""},{"old":"/admin/reports","type":0,"val":"reports","end":""}],
    types: placeholder as Registry['admin.report.index']['types'],
  },
  'admin.report.export': {
    methods: ["GET","HEAD"],
    pattern: '/admin/reports/export',
    tokens: [{"old":"/admin/reports/export","type":0,"val":"admin","end":""},{"old":"/admin/reports/export","type":0,"val":"reports","end":""},{"old":"/admin/reports/export","type":0,"val":"export","end":""}],
    types: placeholder as Registry['admin.report.export']['types'],
  },
  'admin.reconciliation.index': {
    methods: ["GET","HEAD"],
    pattern: '/admin/reconciliations',
    tokens: [{"old":"/admin/reconciliations","type":0,"val":"admin","end":""},{"old":"/admin/reconciliations","type":0,"val":"reconciliations","end":""}],
    types: placeholder as Registry['admin.reconciliation.index']['types'],
  },
  'admin.reconciliation.export': {
    methods: ["GET","HEAD"],
    pattern: '/admin/reconciliations/export',
    tokens: [{"old":"/admin/reconciliations/export","type":0,"val":"admin","end":""},{"old":"/admin/reconciliations/export","type":0,"val":"reconciliations","end":""},{"old":"/admin/reconciliations/export","type":0,"val":"export","end":""}],
    types: placeholder as Registry['admin.reconciliation.export']['types'],
  },
  'admin.reconciliation.update': {
    methods: ["PUT"],
    pattern: '/admin/reconciliations/:number',
    tokens: [{"old":"/admin/reconciliations/:number","type":0,"val":"admin","end":""},{"old":"/admin/reconciliations/:number","type":0,"val":"reconciliations","end":""},{"old":"/admin/reconciliations/:number","type":1,"val":"number","end":""}],
    types: placeholder as Registry['admin.reconciliation.update']['types'],
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

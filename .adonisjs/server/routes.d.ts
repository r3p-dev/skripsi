import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'home': { paramsTuple?: []; params?: {} }
    'robots': { paramsTuple?: []; params?: {} }
    'sitemap': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'transaction.update': { paramsTuple?: []; params?: {} }
    'signup.create': { paramsTuple?: []; params?: {} }
    'signup.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'password_reset.create': { paramsTuple?: []; params?: {} }
    'password_reset.store': { paramsTuple?: []; params?: {} }
    'password_reset.edit': { paramsTuple?: []; params?: {} }
    'password_reset.update': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'customer.profile.show': { paramsTuple?: []; params?: {} }
    'customer.profile.update': { paramsTuple?: []; params?: {} }
    'customer.phone.store': { paramsTuple?: []; params?: {} }
    'customer.phone.update': { paramsTuple?: []; params?: {} }
    'customer.password.update': { paramsTuple?: []; params?: {} }
    'customer.address.show': { paramsTuple?: []; params?: {} }
    'customer.address.create': { paramsTuple?: []; params?: {} }
    'customer.address.store': { paramsTuple?: []; params?: {} }
    'customer.order.create': { paramsTuple?: []; params?: {} }
    'customer.order.receipt': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.orders.index': { paramsTuple?: []; params?: {} }
    'customer.orders.store': { paramsTuple?: []; params?: {} }
    'customer.orders.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customer.orders.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customer.transaction.store': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.transaction.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.profile.show': { paramsTuple?: []; params?: {} }
    'staff.profile.update': { paramsTuple?: []; params?: {} }
    'staff.phone.store': { paramsTuple?: []; params?: {} }
    'staff.phone.update': { paramsTuple?: []; params?: {} }
    'admin.profile.show': { paramsTuple?: []; params?: {} }
    'admin.profile.update': { paramsTuple?: []; params?: {} }
    'admin.phone.store': { paramsTuple?: []; params?: {} }
    'admin.phone.update': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'home': { paramsTuple?: []; params?: {} }
    'robots': { paramsTuple?: []; params?: {} }
    'sitemap': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'signup.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'password_reset.create': { paramsTuple?: []; params?: {} }
    'password_reset.edit': { paramsTuple?: []; params?: {} }
    'customer.profile.show': { paramsTuple?: []; params?: {} }
    'customer.phone.update': { paramsTuple?: []; params?: {} }
    'customer.address.show': { paramsTuple?: []; params?: {} }
    'customer.address.create': { paramsTuple?: []; params?: {} }
    'customer.order.create': { paramsTuple?: []; params?: {} }
    'customer.order.receipt': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.orders.index': { paramsTuple?: []; params?: {} }
    'customer.orders.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customer.transaction.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.profile.show': { paramsTuple?: []; params?: {} }
    'staff.phone.update': { paramsTuple?: []; params?: {} }
    'admin.profile.show': { paramsTuple?: []; params?: {} }
    'admin.phone.update': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'home': { paramsTuple?: []; params?: {} }
    'robots': { paramsTuple?: []; params?: {} }
    'sitemap': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'signup.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'password_reset.create': { paramsTuple?: []; params?: {} }
    'password_reset.edit': { paramsTuple?: []; params?: {} }
    'customer.profile.show': { paramsTuple?: []; params?: {} }
    'customer.phone.update': { paramsTuple?: []; params?: {} }
    'customer.address.show': { paramsTuple?: []; params?: {} }
    'customer.address.create': { paramsTuple?: []; params?: {} }
    'customer.order.create': { paramsTuple?: []; params?: {} }
    'customer.order.receipt': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.orders.index': { paramsTuple?: []; params?: {} }
    'customer.orders.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customer.transaction.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.profile.show': { paramsTuple?: []; params?: {} }
    'staff.phone.update': { paramsTuple?: []; params?: {} }
    'admin.profile.show': { paramsTuple?: []; params?: {} }
    'admin.phone.update': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'transaction.update': { paramsTuple?: []; params?: {} }
    'signup.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'password_reset.store': { paramsTuple?: []; params?: {} }
    'password_reset.update': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'customer.phone.store': { paramsTuple?: []; params?: {} }
    'customer.address.store': { paramsTuple?: []; params?: {} }
    'customer.orders.store': { paramsTuple?: []; params?: {} }
    'customer.transaction.store': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.phone.store': { paramsTuple?: []; params?: {} }
    'admin.phone.store': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'customer.profile.update': { paramsTuple?: []; params?: {} }
    'customer.password.update': { paramsTuple?: []; params?: {} }
    'customer.orders.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'staff.profile.update': { paramsTuple?: []; params?: {} }
    'admin.profile.update': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'customer.orders.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'home': { paramsTuple?: []; params?: {} }
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
    'customer.order.store': { paramsTuple?: []; params?: {} }
    'customer.order.index': { paramsTuple?: []; params?: {} }
    'customer.order.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.order.receipt': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.transaction.store': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.transaction.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.profile.show': { paramsTuple?: []; params?: {} }
    'staff.profile.update': { paramsTuple?: []; params?: {} }
    'staff.phone.store': { paramsTuple?: []; params?: {} }
    'staff.phone.update': { paramsTuple?: []; params?: {} }
    'staff.trip.index': { paramsTuple?: []; params?: {} }
    'staff.trip.show': { paramsTuple: [ParamValue,ParamValue]; params: {'number': ParamValue,'type': ParamValue} }
    'staff.trip.update': { paramsTuple: [ParamValue,ParamValue]; params: {'number': ParamValue,'type': ParamValue} }
    'staff.trip.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'number': ParamValue,'type': ParamValue} }
    'staff.inspection.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.inspection.update': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.inspection.destroy': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.order.create': { paramsTuple?: []; params?: {} }
    'staff.order.store': { paramsTuple?: []; params?: {} }
    'staff.transaction.store': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.transaction.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'admin.profile.show': { paramsTuple?: []; params?: {} }
    'admin.profile.edit': { paramsTuple?: []; params?: {} }
    'admin.profile.update': { paramsTuple?: []; params?: {} }
    'admin.dashboard.index': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'home': { paramsTuple?: []; params?: {} }
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
    'customer.order.index': { paramsTuple?: []; params?: {} }
    'customer.order.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.order.receipt': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.transaction.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.profile.show': { paramsTuple?: []; params?: {} }
    'staff.phone.update': { paramsTuple?: []; params?: {} }
    'staff.trip.index': { paramsTuple?: []; params?: {} }
    'staff.trip.show': { paramsTuple: [ParamValue,ParamValue]; params: {'number': ParamValue,'type': ParamValue} }
    'staff.inspection.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.order.create': { paramsTuple?: []; params?: {} }
    'staff.transaction.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'admin.profile.show': { paramsTuple?: []; params?: {} }
    'admin.profile.edit': { paramsTuple?: []; params?: {} }
    'admin.dashboard.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'home': { paramsTuple?: []; params?: {} }
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
    'customer.order.index': { paramsTuple?: []; params?: {} }
    'customer.order.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.order.receipt': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.transaction.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.profile.show': { paramsTuple?: []; params?: {} }
    'staff.phone.update': { paramsTuple?: []; params?: {} }
    'staff.trip.index': { paramsTuple?: []; params?: {} }
    'staff.trip.show': { paramsTuple: [ParamValue,ParamValue]; params: {'number': ParamValue,'type': ParamValue} }
    'staff.inspection.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.order.create': { paramsTuple?: []; params?: {} }
    'staff.transaction.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'admin.profile.show': { paramsTuple?: []; params?: {} }
    'admin.profile.edit': { paramsTuple?: []; params?: {} }
    'admin.dashboard.index': { paramsTuple?: []; params?: {} }
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
    'customer.order.store': { paramsTuple?: []; params?: {} }
    'customer.transaction.store': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.phone.store': { paramsTuple?: []; params?: {} }
    'staff.order.store': { paramsTuple?: []; params?: {} }
    'staff.transaction.store': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
  }
  PUT: {
    'customer.profile.update': { paramsTuple?: []; params?: {} }
    'customer.password.update': { paramsTuple?: []; params?: {} }
    'staff.profile.update': { paramsTuple?: []; params?: {} }
    'staff.trip.update': { paramsTuple: [ParamValue,ParamValue]; params: {'number': ParamValue,'type': ParamValue} }
    'staff.inspection.update': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'admin.profile.update': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'staff.trip.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'number': ParamValue,'type': ParamValue} }
    'staff.inspection.destroy': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
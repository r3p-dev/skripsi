import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'home': { paramsTuple?: []; params?: {} }
    'register.create': { paramsTuple?: []; params?: {} }
    'register.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'forgot_password.create': { paramsTuple?: []; params?: {} }
    'forgot_password.store': { paramsTuple?: []; params?: {} }
    'reset_password.create': { paramsTuple?: []; params?: {} }
    'reset_password.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'full_payment.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'full_payment.store': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'profile.show': { paramsTuple?: []; params?: {} }
    'profile.update': { paramsTuple?: []; params?: {} }
    'address.show': { paramsTuple?: []; params?: {} }
    'address.create': { paramsTuple?: []; params?: {} }
    'address.update': { paramsTuple?: []; params?: {} }
    'order.index': { paramsTuple?: []; params?: {} }
    'order.create': { paramsTuple?: []; params?: {} }
    'order.store': { paramsTuple?: []; params?: {} }
    'order.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'down_payment.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'down_payment.store': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'task.index': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'home': { paramsTuple?: []; params?: {} }
    'register.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'forgot_password.create': { paramsTuple?: []; params?: {} }
    'reset_password.create': { paramsTuple?: []; params?: {} }
    'full_payment.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'profile.show': { paramsTuple?: []; params?: {} }
    'address.show': { paramsTuple?: []; params?: {} }
    'address.create': { paramsTuple?: []; params?: {} }
    'order.index': { paramsTuple?: []; params?: {} }
    'order.create': { paramsTuple?: []; params?: {} }
    'order.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'down_payment.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'task.index': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'home': { paramsTuple?: []; params?: {} }
    'register.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'forgot_password.create': { paramsTuple?: []; params?: {} }
    'reset_password.create': { paramsTuple?: []; params?: {} }
    'full_payment.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'profile.show': { paramsTuple?: []; params?: {} }
    'address.show': { paramsTuple?: []; params?: {} }
    'address.create': { paramsTuple?: []; params?: {} }
    'order.index': { paramsTuple?: []; params?: {} }
    'order.create': { paramsTuple?: []; params?: {} }
    'order.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'down_payment.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'task.index': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'register.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'forgot_password.store': { paramsTuple?: []; params?: {} }
    'reset_password.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'full_payment.store': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'profile.update': { paramsTuple?: []; params?: {} }
    'address.update': { paramsTuple?: []; params?: {} }
    'order.store': { paramsTuple?: []; params?: {} }
    'down_payment.store': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
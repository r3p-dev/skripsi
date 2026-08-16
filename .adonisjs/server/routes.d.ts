import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'robots': { paramsTuple?: []; params?: {} }
    'sitemap': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'transaction.update': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'signup.create': { paramsTuple?: []; params?: {} }
    'signup.store': { paramsTuple?: []; params?: {} }
    'session.create_internal': { paramsTuple?: []; params?: {} }
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
    'customer.address.geocode': { paramsTuple?: []; params?: {} }
    'customer.address.nearby': { paramsTuple?: []; params?: {} }
    'customer.address.show': { paramsTuple?: []; params?: {} }
    'customer.address.create': { paramsTuple?: []; params?: {} }
    'customer.address.store': { paramsTuple?: []; params?: {} }
    'customer.orders.receipt': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.transaction.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.transaction.store': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.orders.index': { paramsTuple?: []; params?: {} }
    'customer.orders.create': { paramsTuple?: []; params?: {} }
    'customer.orders.store': { paramsTuple?: []; params?: {} }
    'customer.orders.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.orders.update': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
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
    'staff.cleaning.update': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.collection.update': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.notification.store': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.tag.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.customers.index': { paramsTuple?: []; params?: {} }
    'staff.order.create': { paramsTuple?: []; params?: {} }
    'staff.order.store': { paramsTuple?: []; params?: {} }
    'staff.order.edit': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.order.update': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.order.receipt': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'internal.action.photo': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.profile.show': { paramsTuple?: []; params?: {} }
    'admin.profile.update': { paramsTuple?: []; params?: {} }
    'admin.phone.store': { paramsTuple?: []; params?: {} }
    'admin.phone.update': { paramsTuple?: []; params?: {} }
    'admin.dashboard.index': { paramsTuple?: []; params?: {} }
    'admin.order.export': { paramsTuple?: []; params?: {} }
    'admin.order.index': { paramsTuple?: []; params?: {} }
    'admin.order.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'admin.reconciliation.index': { paramsTuple?: []; params?: {} }
    'admin.reconciliation.update': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'admin.catalogue.index': { paramsTuple?: []; params?: {} }
    'admin.catalogue.create': { paramsTuple?: []; params?: {} }
    'admin.catalogue.store': { paramsTuple?: []; params?: {} }
    'admin.catalogue.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.catalogue.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.catalogue.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.user.index': { paramsTuple?: []; params?: {} }
    'admin.user.create': { paramsTuple?: []; params?: {} }
    'admin.user.store': { paramsTuple?: []; params?: {} }
    'admin.user.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.user.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.user.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.report.export': { paramsTuple?: []; params?: {} }
    'admin.report.index': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'robots': { paramsTuple?: []; params?: {} }
    'sitemap': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'signup.create': { paramsTuple?: []; params?: {} }
    'session.create_internal': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'password_reset.create': { paramsTuple?: []; params?: {} }
    'password_reset.edit': { paramsTuple?: []; params?: {} }
    'customer.profile.show': { paramsTuple?: []; params?: {} }
    'customer.phone.update': { paramsTuple?: []; params?: {} }
    'customer.address.geocode': { paramsTuple?: []; params?: {} }
    'customer.address.nearby': { paramsTuple?: []; params?: {} }
    'customer.address.show': { paramsTuple?: []; params?: {} }
    'customer.address.create': { paramsTuple?: []; params?: {} }
    'customer.orders.receipt': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.transaction.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.orders.index': { paramsTuple?: []; params?: {} }
    'customer.orders.create': { paramsTuple?: []; params?: {} }
    'customer.orders.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.profile.show': { paramsTuple?: []; params?: {} }
    'staff.phone.update': { paramsTuple?: []; params?: {} }
    'staff.trip.index': { paramsTuple?: []; params?: {} }
    'staff.trip.show': { paramsTuple: [ParamValue,ParamValue]; params: {'number': ParamValue,'type': ParamValue} }
    'staff.inspection.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.tag.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.customers.index': { paramsTuple?: []; params?: {} }
    'staff.order.create': { paramsTuple?: []; params?: {} }
    'staff.order.edit': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.order.receipt': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'internal.action.photo': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.profile.show': { paramsTuple?: []; params?: {} }
    'admin.phone.update': { paramsTuple?: []; params?: {} }
    'admin.dashboard.index': { paramsTuple?: []; params?: {} }
    'admin.order.export': { paramsTuple?: []; params?: {} }
    'admin.order.index': { paramsTuple?: []; params?: {} }
    'admin.order.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'admin.reconciliation.index': { paramsTuple?: []; params?: {} }
    'admin.catalogue.index': { paramsTuple?: []; params?: {} }
    'admin.catalogue.create': { paramsTuple?: []; params?: {} }
    'admin.catalogue.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.user.index': { paramsTuple?: []; params?: {} }
    'admin.user.create': { paramsTuple?: []; params?: {} }
    'admin.user.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.report.export': { paramsTuple?: []; params?: {} }
    'admin.report.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'robots': { paramsTuple?: []; params?: {} }
    'sitemap': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'signup.create': { paramsTuple?: []; params?: {} }
    'session.create_internal': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'password_reset.create': { paramsTuple?: []; params?: {} }
    'password_reset.edit': { paramsTuple?: []; params?: {} }
    'customer.profile.show': { paramsTuple?: []; params?: {} }
    'customer.phone.update': { paramsTuple?: []; params?: {} }
    'customer.address.geocode': { paramsTuple?: []; params?: {} }
    'customer.address.nearby': { paramsTuple?: []; params?: {} }
    'customer.address.show': { paramsTuple?: []; params?: {} }
    'customer.address.create': { paramsTuple?: []; params?: {} }
    'customer.orders.receipt': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.transaction.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.orders.index': { paramsTuple?: []; params?: {} }
    'customer.orders.create': { paramsTuple?: []; params?: {} }
    'customer.orders.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.profile.show': { paramsTuple?: []; params?: {} }
    'staff.phone.update': { paramsTuple?: []; params?: {} }
    'staff.trip.index': { paramsTuple?: []; params?: {} }
    'staff.trip.show': { paramsTuple: [ParamValue,ParamValue]; params: {'number': ParamValue,'type': ParamValue} }
    'staff.inspection.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.tag.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.customers.index': { paramsTuple?: []; params?: {} }
    'staff.order.create': { paramsTuple?: []; params?: {} }
    'staff.order.edit': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.order.receipt': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'internal.action.photo': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.profile.show': { paramsTuple?: []; params?: {} }
    'admin.phone.update': { paramsTuple?: []; params?: {} }
    'admin.dashboard.index': { paramsTuple?: []; params?: {} }
    'admin.order.export': { paramsTuple?: []; params?: {} }
    'admin.order.index': { paramsTuple?: []; params?: {} }
    'admin.order.show': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'admin.reconciliation.index': { paramsTuple?: []; params?: {} }
    'admin.catalogue.index': { paramsTuple?: []; params?: {} }
    'admin.catalogue.create': { paramsTuple?: []; params?: {} }
    'admin.catalogue.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.user.index': { paramsTuple?: []; params?: {} }
    'admin.user.create': { paramsTuple?: []; params?: {} }
    'admin.user.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.report.export': { paramsTuple?: []; params?: {} }
    'admin.report.index': { paramsTuple?: []; params?: {} }
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
    'customer.transaction.store': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'customer.orders.store': { paramsTuple?: []; params?: {} }
    'staff.phone.store': { paramsTuple?: []; params?: {} }
    'staff.trip.update': { paramsTuple: [ParamValue,ParamValue]; params: {'number': ParamValue,'type': ParamValue} }
    'staff.inspection.update': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.cleaning.update': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.collection.update': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.notification.store': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.order.store': { paramsTuple?: []; params?: {} }
    'admin.phone.store': { paramsTuple?: []; params?: {} }
    'admin.reconciliation.update': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'admin.catalogue.store': { paramsTuple?: []; params?: {} }
    'admin.user.store': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'customer.profile.update': { paramsTuple?: []; params?: {} }
    'customer.password.update': { paramsTuple?: []; params?: {} }
    'customer.orders.update': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'staff.profile.update': { paramsTuple?: []; params?: {} }
    'staff.order.update': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'admin.profile.update': { paramsTuple?: []; params?: {} }
    'admin.catalogue.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.user.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'customer.orders.update': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
  }
  DELETE: {
    'staff.trip.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'number': ParamValue,'type': ParamValue} }
    'staff.inspection.destroy': { paramsTuple: [ParamValue]; params: {'number': ParamValue} }
    'admin.catalogue.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.user.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'drive.fs.serve': {
    methods: ["GET","HEAD"]
    pattern: '/uploads/*'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { '*': ParamValue[] }
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'home': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/home_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/home_controller').default['index']>>>
    }
  }
  'robots': {
    methods: ["GET","HEAD"]
    pattern: '/robots.txt'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'sitemap': {
    methods: ["GET","HEAD"]
    pattern: '/sitemap.xml'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'event_stream': {
    methods: ["GET","HEAD"]
    pattern: '/__transmit/events'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'subscribe': {
    methods: ["POST"]
    pattern: '/__transmit/subscribe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'unsubscribe': {
    methods: ["POST"]
    pattern: '/__transmit/unsubscribe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'transaction.update': {
    methods: ["POST"]
    pattern: '/transaction/callback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/webhooks/transaction_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/webhooks/transaction_controller').default['update']>>>
    }
  }
  'signup.create': {
    methods: ["GET","HEAD"]
    pattern: '/signup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/signup_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/signup_controller').default['create']>>>
    }
  }
  'signup.store': {
    methods: ["POST"]
    pattern: '/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth_validator').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth_validator').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/signup_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/signup_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'session.create': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['create']>>>
    }
  }
  'session.store': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth_validator').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth_validator').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'password_reset.create': {
    methods: ["GET","HEAD"]
    pattern: '/forgot-password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/password_reset_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/password_reset_controller').default['create']>>>
    }
  }
  'password_reset.store': {
    methods: ["POST"]
    pattern: '/forgot-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth_validator').forgotPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth_validator').forgotPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/password_reset_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/password_reset_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'password_reset.edit': {
    methods: ["GET","HEAD"]
    pattern: '/reset-password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/password_reset_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/password_reset_controller').default['edit']>>>
    }
  }
  'password_reset.update': {
    methods: ["POST"]
    pattern: '/reset-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth_validator').resetPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth_validator').resetPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/password_reset_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/password_reset_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'session.destroy': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['destroy']>>>
    }
  }
  'customer.profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/profile_controller').default['show']>>>
    }
  }
  'customer.profile.update': {
    methods: ["PUT"]
    pattern: '/profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/profile_validator').changeNameValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/profile_validator').changeNameValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/profile_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/profile_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customer.phone.store': {
    methods: ["POST"]
    pattern: '/phone'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/profile_validator').changePhoneValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/profile_validator').changePhoneValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/phone_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/phone_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customer.phone.update': {
    methods: ["GET","HEAD"]
    pattern: '/phone/verify'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/phone_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/phone_controller').default['update']>>>
    }
  }
  'customer.password.update': {
    methods: ["PUT"]
    pattern: '/password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/profile_validator').changePasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/profile_validator').changePasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/password_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/password_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customer.address.show': {
    methods: ["GET","HEAD"]
    pattern: '/address'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/address_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/address_controller').default['show']>>>
    }
  }
  'customer.address.create': {
    methods: ["GET","HEAD"]
    pattern: '/address/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/address_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/address_controller').default['create']>>>
    }
  }
  'customer.address.store': {
    methods: ["POST"]
    pattern: '/address'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/address_validator').addressValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/address_validator').addressValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/address_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/address_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customer.order.create': {
    methods: ["GET","HEAD"]
    pattern: '/order'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['create']>>>
    }
  }
  'customer.order.store': {
    methods: ["POST"]
    pattern: '/orders'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/order_validator').orderValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/order_validator').orderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customer.order.index': {
    methods: ["GET","HEAD"]
    pattern: '/orders'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['index']>>>
    }
  }
  'customer.order.show': {
    methods: ["GET","HEAD"]
    pattern: '/orders/:number'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['show']>>>
    }
  }
  'customer.order.update': {
    methods: ["PUT"]
    pattern: '/orders/:number'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['update']>>>
    }
  }
  'customer.order.receipt': {
    methods: ["GET","HEAD"]
    pattern: '/orders/:number/receipt'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['receipt']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['receipt']>>>
    }
  }
  'customer.transaction.store': {
    methods: ["POST"]
    pattern: '/orders/:number/transactions'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/transaction_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/transaction_controller').default['store']>>>
    }
  }
  'customer.transaction.show': {
    methods: ["GET","HEAD"]
    pattern: '/orders/:number/transactions/latest'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/transaction_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/transaction_controller').default['show']>>>
    }
  }
  'staff.profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/staff/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/profile_controller').default['show']>>>
    }
  }
  'staff.profile.update': {
    methods: ["PUT"]
    pattern: '/staff/profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/profile_validator').changePasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/profile_validator').changePasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/profile_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/profile_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'staff.phone.store': {
    methods: ["POST"]
    pattern: '/staff/phone'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/profile_validator').changePhoneValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/profile_validator').changePhoneValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/phone_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/phone_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'staff.phone.update': {
    methods: ["GET","HEAD"]
    pattern: '/staff/phone/verify'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/phone_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/phone_controller').default['update']>>>
    }
  }
  'staff.trip.index': {
    methods: ["GET","HEAD"]
    pattern: '/staff/trips'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/trip_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/trip_controller').default['index']>>>
    }
  }
  'staff.trip.show': {
    methods: ["GET","HEAD"]
    pattern: '/staff/trips/:number/:type'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { number: ParamValue; type: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/trip_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/trip_controller').default['show']>>>
    }
  }
  'staff.trip.update': {
    methods: ["PUT"]
    pattern: '/staff/trips/:number/:type'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/order_validator').completeTaskValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { number: ParamValue; type: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/order_validator').completeTaskValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/trip_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/trip_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'staff.trip.destroy': {
    methods: ["DELETE"]
    pattern: '/staff/trips/:number/:type'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { number: ParamValue; type: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/trip_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/trip_controller').default['destroy']>>>
    }
  }
  'staff.inspection.show': {
    methods: ["GET","HEAD"]
    pattern: '/staff/inspections/:number'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/inspection_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/inspection_controller').default['show']>>>
    }
  }
  'staff.inspection.update': {
    methods: ["PUT"]
    pattern: '/staff/inspections/:number'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/order_validator').inspectionValidator)>>
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/order_validator').inspectionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/inspection_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/inspection_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'staff.inspection.destroy': {
    methods: ["DELETE"]
    pattern: '/staff/inspections/:number'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/inspection_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/inspection_controller').default['destroy']>>>
    }
  }
  'staff.cleaning.update': {
    methods: ["PUT"]
    pattern: '/staff/cleanings/:number'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/order_validator').cleaningValidator)>>
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/order_validator').cleaningValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/cleaning_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/cleaning_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'staff.collection.update': {
    methods: ["PUT"]
    pattern: '/staff/collections/:number'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/collection_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/collection_controller').default['update']>>>
    }
  }
  'staff.customer.index': {
    methods: ["GET","HEAD"]
    pattern: '/staff/customers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/customer_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/customer_controller').default['index']>>>
    }
  }
  'staff.order.create': {
    methods: ["GET","HEAD"]
    pattern: '/staff/orders/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['create']>>>
    }
  }
  'staff.order.store': {
    methods: ["POST"]
    pattern: '/staff/orders'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/order_validator').offlineOrderValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/order_validator').offlineOrderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'staff.order.edit': {
    methods: ["GET","HEAD"]
    pattern: '/staff/orders/:number/items'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['edit']>>>
    }
  }
  'staff.order.update': {
    methods: ["PUT"]
    pattern: '/staff/orders/:number/items'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/order_validator').orderItemsValidator)>>
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/order_validator').orderItemsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'staff.tag.show': {
    methods: ["GET","HEAD"]
    pattern: '/staff/orders/:number/tag'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/tag_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/tag_controller').default['show']>>>
    }
  }
  'staff.order.receipt': {
    methods: ["GET","HEAD"]
    pattern: '/staff/orders/:number/receipt'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['receipt']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['receipt']>>>
    }
  }
  'staff.notification.store': {
    methods: ["POST"]
    pattern: '/staff/orders/:number/notifications'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/notification_validator').orderNotificationValidator)>>
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/notification_validator').orderNotificationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/notification_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/notification_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'staff.transaction.store': {
    methods: ["POST"]
    pattern: '/staff/orders/:number/transactions'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/transaction_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/transaction_controller').default['store']>>>
    }
  }
  'staff.transaction.show': {
    methods: ["GET","HEAD"]
    pattern: '/staff/orders/:number/transactions/latest'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/transaction_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/transaction_controller').default['show']>>>
    }
  }
  'admin.profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/admin/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/profile_controller').default['show']>>>
    }
  }
  'admin.profile.update': {
    methods: ["PUT"]
    pattern: '/admin/profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/profile_validator').changePasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/profile_validator').changePasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/profile_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/profile_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.phone.store': {
    methods: ["POST"]
    pattern: '/admin/phone'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/profile_validator').changePhoneValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/profile_validator').changePhoneValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/phone_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/phone_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.phone.update': {
    methods: ["GET","HEAD"]
    pattern: '/admin/phone/verify'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/phone_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/phone_controller').default['update']>>>
    }
  }
  'admin.dashboard.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/dashboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/dashboard_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/dashboard_controller').default['index']>>>
    }
  }
  'admin.dashboard.export': {
    methods: ["GET","HEAD"]
    pattern: '/admin/dashboard/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/dashboard_controller').default['export']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/dashboard_controller').default['export']>>>
    }
  }
  'admin.signup.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/signup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/signup_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/signup_controller').default['create']>>>
    }
  }
  'admin.signup.store': {
    methods: ["POST"]
    pattern: '/admin/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user_validator').staffSignupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user_validator').staffSignupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/signup_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/signup_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.order.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/order_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/order_controller').default['index']>>>
    }
  }
  'admin.order.export': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/order_controller').default['export']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/order_controller').default['export']>>>
    }
  }
  'admin.order.show': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/:number'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/order_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/order_controller').default['show']>>>
    }
  }
  'admin.service.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/services'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/service_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/service_controller').default['index']>>>
    }
  }
  'admin.service.export': {
    methods: ["GET","HEAD"]
    pattern: '/admin/services/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/service_controller').default['export']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/service_controller').default['export']>>>
    }
  }
  'admin.service.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/services/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/service_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/service_controller').default['create']>>>
    }
  }
  'admin.service.store': {
    methods: ["POST"]
    pattern: '/admin/services'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/service_validator').serviceValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/service_validator').serviceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/service_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/service_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.service.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/services/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/service_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/service_controller').default['edit']>>>
    }
  }
  'admin.service.update': {
    methods: ["PUT"]
    pattern: '/admin/services/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/service_validator').serviceValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/service_validator').serviceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/service_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/service_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.service.destroy': {
    methods: ["DELETE"]
    pattern: '/admin/services/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/service_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/service_controller').default['destroy']>>>
    }
  }
  'admin.user.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/user_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/user_controller').default['index']>>>
    }
  }
  'admin.user.export': {
    methods: ["GET","HEAD"]
    pattern: '/admin/users/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/user_controller').default['export']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/user_controller').default['export']>>>
    }
  }
  'admin.user.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/users/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/user_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/user_controller').default['create']>>>
    }
  }
  'admin.user.store': {
    methods: ["POST"]
    pattern: '/admin/users'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user_validator').createUserValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user_validator').createUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/user_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/user_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.user.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/users/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/user_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/user_controller').default['edit']>>>
    }
  }
  'admin.user.update': {
    methods: ["PUT"]
    pattern: '/admin/users/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user_validator').updateUserValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/user_validator').updateUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/user_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/user_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.user.destroy': {
    methods: ["DELETE"]
    pattern: '/admin/users/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/user_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/user_controller').default['destroy']>>>
    }
  }
  'admin.report.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/reports'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/report_validator').reportValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/report_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/report_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.report.export': {
    methods: ["GET","HEAD"]
    pattern: '/admin/reports/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/report_validator').reportValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/report_controller').default['export']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/report_controller').default['export']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.reconciliation.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/reconciliations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/reconciliation_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/reconciliation_controller').default['index']>>>
    }
  }
  'admin.reconciliation.export': {
    methods: ["GET","HEAD"]
    pattern: '/admin/reconciliations/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/reconciliation_controller').default['export']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/reconciliation_controller').default['export']>>>
    }
  }
  'admin.reconciliation.update': {
    methods: ["PUT"]
    pattern: '/admin/reconciliations/:number'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/reconciliation_validator').reconciliationValidator)>>
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/reconciliation_validator').reconciliationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/reconciliation_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/reconciliation_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}

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
  'session.create_internal': {
    methods: ["GET","HEAD"]
    pattern: '/internal/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['createInternal']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth/session_controller').default['createInternal']>>>
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
  'customer.address.geocode': {
    methods: ["GET","HEAD"]
    pattern: '/address/geocode'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/geocode_validator').geocodeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/geocode_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/geocode_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customer.address.nearby': {
    methods: ["GET","HEAD"]
    pattern: '/address/nearby'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/geocode_validator').nearbyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/geocode_controller').default['nearby']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/geocode_controller').default['nearby']>>> | { status: 422; response: { errors: SimpleError[] } }
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
  'customer.orders.receipt': {
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
  'customer.transaction.show': {
    methods: ["GET","HEAD"]
    pattern: '/orders/:number/payment'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/transaction_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/transaction_controller').default['show']>>>
    }
  }
  'customer.transaction.store': {
    methods: ["POST"]
    pattern: '/orders/:number/payment'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/transaction_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/transaction_controller').default['store']>>>
    }
  }
  'customer.orders.index': {
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
  'customer.orders.create': {
    methods: ["GET","HEAD"]
    pattern: '/orders/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['create']>>>
    }
  }
  'customer.orders.store': {
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
  'customer.orders.show': {
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
  'customer.orders.update': {
    methods: ["PUT","PATCH"]
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
      body: ExtractBody<InferInput<(typeof import('#validators/profile_validator').changeNameValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/profile_validator').changeNameValidator)>>
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
    pattern: '/staff/tasks'
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
    pattern: '/staff/tasks/:number/trip/:type'
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
    methods: ["POST"]
    pattern: '/staff/tasks/:number/trip/:type'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/task_validator').taskPhotoValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { number: ParamValue; type: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/task_validator').taskPhotoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/trip_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/trip_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'staff.trip.destroy': {
    methods: ["DELETE"]
    pattern: '/staff/tasks/:number/trip/:type'
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
    pattern: '/staff/tasks/:number/inspection'
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
    methods: ["POST"]
    pattern: '/staff/tasks/:number/inspection'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/task_validator').inspectionValidator)>>
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/task_validator').inspectionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/inspection_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/inspection_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'staff.inspection.destroy': {
    methods: ["DELETE"]
    pattern: '/staff/tasks/:number/inspection'
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
    methods: ["POST"]
    pattern: '/staff/tasks/:number/cleaning'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/task_validator').taskPhotoValidator)>>
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/task_validator').taskPhotoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/cleaning_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/cleaning_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'staff.collection.update': {
    methods: ["POST"]
    pattern: '/staff/tasks/:number/collection'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/collection_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/collection_controller').default['update']>>>
    }
  }
  'staff.notification.store': {
    methods: ["POST"]
    pattern: '/staff/tasks/:number/notification'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/notification_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/notification_controller').default['store']>>>
    }
  }
  'staff.tag.show': {
    methods: ["GET","HEAD"]
    pattern: '/staff/tasks/:number/tag'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/tag_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/tag_controller').default['show']>>>
    }
  }
  'internal.action.photo': {
    methods: ["GET","HEAD"]
    pattern: '/internal/actions/:id/photo'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/internal/action_photo_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/internal/action_photo_controller').default['show']>>>
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
      body: ExtractBody<InferInput<(typeof import('#validators/profile_validator').changeNameValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/profile_validator').changeNameValidator)>>
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
}

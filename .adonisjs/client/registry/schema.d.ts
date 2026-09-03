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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seo_controller').default['robots']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seo_controller').default['robots']>>>
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seo_controller').default['sitemap']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seo_controller').default['sitemap']>>>
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
  'customer.orders.destroy': {
    methods: ["DELETE"]
    pattern: '/orders/:number'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer/order_controller').default['destroy']>>>
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
  'staff.trip.claim': {
    methods: ["POST"]
    pattern: '/staff/tasks/:number/trip/:type/claim'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { number: ParamValue; type: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/trip_controller').default['claim']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/trip_controller').default['claim']>>>
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
  'staff.inspection.claim': {
    methods: ["POST"]
    pattern: '/staff/tasks/:number/inspection/claim'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/inspection_controller').default['claim']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/inspection_controller').default['claim']>>>
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
      body: ExtractBody<InferInput<(typeof import('#validators/task_validator').taskPhotoValidator)>>
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/task_validator').taskPhotoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/collection_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/collection_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
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
  'staff.customers.index': {
    methods: ["GET","HEAD"]
    pattern: '/staff/customers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['customers']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['customers']>>>
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
      body: ExtractBody<InferInput<(typeof import('#validators/task_validator').offlineOrderValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/task_validator').offlineOrderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'staff.order.edit': {
    methods: ["GET","HEAD"]
    pattern: '/staff/orders/:number/edit'
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
    pattern: '/staff/orders/:number'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/task_validator').orderItemsValidator)>>
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/task_validator').orderItemsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/staff/order_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
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
  'admin.dashboard.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/dashboard_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/dashboard_controller').default['index']>>>
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
  'admin.reconciliation.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/reconciliation'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/reconciliation_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/reconciliation_controller').default['index']>>>
    }
  }
  'admin.reconciliation.update': {
    methods: ["POST"]
    pattern: '/admin/reconciliation/:number'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_validator').reconciliationValidator)>>
      paramsTuple: [ParamValue]
      params: { number: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_validator').reconciliationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/reconciliation_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/reconciliation_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.catalogue.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/catalogues'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['index']>>>
    }
  }
  'admin.catalogue.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/catalogues/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['create']>>>
    }
  }
  'admin.catalogue.store': {
    methods: ["POST"]
    pattern: '/admin/catalogues'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogue_validator').catalogueValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogue_validator').catalogueValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.catalogue.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/catalogues/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['edit']>>>
    }
  }
  'admin.catalogue.update': {
    methods: ["PUT"]
    pattern: '/admin/catalogues/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalogue_validator').catalogueValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/catalogue_validator').catalogueValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.catalogue.destroy': {
    methods: ["DELETE"]
    pattern: '/admin/catalogues/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/catalogue_controller').default['destroy']>>>
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
      body: ExtractBody<InferInput<(typeof import('#validators/user_validator').userValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user_validator').userValidator)>>
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
      body: ExtractBody<InferInput<(typeof import('#validators/admin_validator').adminUserValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_validator').adminUserValidator)>>
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
  'admin.report.export': {
    methods: ["GET","HEAD"]
    pattern: '/admin/reports/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/report_controller').default['export']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/report_controller').default['export']>>>
    }
  }
  'admin.report.index': {
    methods: ["GET","HEAD"]
    pattern: '/admin/reports'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/report_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/report_controller').default['index']>>>
    }
  }
}

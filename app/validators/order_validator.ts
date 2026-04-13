import { OrderType } from '#models/order'
import { PaymentMethod } from '#models/transaction'
import vine from '@vinejs/vine'
import { name, note, phone, shoe } from './validator.ts'

export const orderValidator = vine.create({
  addressId: vine.number().positive(),
  date: vine.date(),
})

export const customerValidator = vine.create({
  phone: phone(),
})

export const offlineOrderValidator = vine.create({
  name: name(),
  phone: phone(),
  totalShoes: vine.number(),
  shoes: vine.array(shoe),
  type: vine.enum(Object.values(OrderType)),
  paymentMethod: vine.enum(Object.values(PaymentMethod)),
  note: note(),
})

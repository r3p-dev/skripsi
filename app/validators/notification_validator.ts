import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

/**
 * The messages staff may send a customer about an order.
 *
 * A closed list rather than free text on purpose: this sends a WhatsApp from
 * the shop's own number, and what leaves under the shop's name is not
 * something an order screen should let anyone compose on the spot.
 */
export const OrderNotice = {
  /** "This order is still waiting to be paid for." */
  PAYMENT: 'payment',
  /** "Your shoes are washed and ready to collect." */
  READY: 'ready',
} as const

export type OrderNotice = (typeof OrderNotice)[keyof typeof OrderNotice]

export const orderNotificationValidator = vine.create({
  notice: vine.enum(Object.values(OrderNotice)),
})

export type OrderNotificationData = Infer<typeof orderNotificationValidator>

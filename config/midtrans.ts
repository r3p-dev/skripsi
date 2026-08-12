import env from '#start/env'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const midtransClient = require('midtrans-client')

export interface MidtransNotification {
  transaction_type: string
  transaction_time: string
  transaction_status: string
  transaction_id: string
  status_message: string
  status_code: string
  signature_key: string
  settlement_time: string
  payment_type: string
  order_id: string
  merchant_id: string
  merchant_cross_reference_id: string
  issuer: string
  gross_amount: string
  fraud_status: string
  currency: string
  acquirer: string
}

export const core = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: env.get('MIDTRANS_SERVER_KEY').release(),
})

export function verifyNotificationSignature(payload: MidtransNotification): boolean {
  const serverKey = env.get('MIDTRANS_SERVER_KEY').release()

  const expectedSignature = createHash('sha512')
    .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`)
    .digest('hex')

  return expectedSignature === payload.signature_key
}

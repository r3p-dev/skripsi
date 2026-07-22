import env from '#start/env'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const midtransClient = require('midtrans-client')

/**
 * Payload received from Midtrans payment notification webhooks.
 */
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

/**
 * Response returned by Midtrans after creating a Snap transaction.
 */
export interface MidtransSnapResponse {
  token: string
  redirect_url: string
}

/**
 * Snap client used to create Midtrans payment transactions.
 */
export const snap = new midtransClient.Snap({
  /**
   * Use the Midtrans sandbox environment.
   */
  isProduction: false,

  /**
   * Server key used to authenticate requests to Midtrans.
   */
  serverKey: env.get('MIDTRANS_SERVER_KEY'),
})

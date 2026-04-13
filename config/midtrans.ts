import env from '#start/env'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const midtransClient = require('midtrans-client')

interface MidtransQrisAction {
  name: string
  method: string
  url: string
}

export interface MidtransQrisResponse {
  status_code: string
  status_message: string
  transaction_id: string
  order_id: string
  merchant_id: string
  gross_amount: string
  currency: string
  payment_type: 'qris'
  transaction_time: string
  transaction_status: string
  fraud_status: string
  acquirer: string
  actions: MidtransQrisAction[]
}

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
  issuer: string
  gross_amount: string
  fraud_status: string
  currency: string
  acquirer: string
  expiry_time?: string
  custom_field1: string
}

const midtrans = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: env.get('MIDTRANS_SERVER_KEY'),
})

export default midtrans

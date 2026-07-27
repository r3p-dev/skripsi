import { type MidtransNotification, verifyNotificationSignature } from '#config/midtrans'
import TransactionService from '#services/transaction_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Receives Midtrans HTTP notification webhooks. Public by design — Midtrans
 * calls this endpoint directly, so authenticity is proven via the payload's
 * signature key rather than a session.
 */
@inject()
export default class TransactionController {
  constructor(protected service: TransactionService) {}

  async update({ request, response }: HttpContext) {
    const payload = request.body() as MidtransNotification

    if (!verifyNotificationSignature(payload)) {
      return response.forbidden({ message: 'Invalid signature' })
    }

    await this.service.handleNotification(payload)

    return response.ok({ message: 'OK' })
  }
}

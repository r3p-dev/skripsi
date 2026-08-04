import { type MidtransNotification, verifyNotificationSignature } from '#config/midtrans'
import TransactionService from '#services/transaction_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class TransactionController {
  constructor(protected transactionService: TransactionService) {}

  async update({ request, response }: HttpContext) {
    const payload = request.body() as MidtransNotification

    if (!verifyNotificationSignature(payload)) {
      return response.forbidden({ message: 'Invalid signature' })
    }

    await this.transactionService.handleNotification(payload)

    return response.ok({ message: 'OK' })
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import OrderService from '#services/order_service'

@inject()
export default class CustomerController {
  constructor(protected orderService: OrderService) {}

  /**
   * Looks up registered customers for the counter form.
   *
   * A walk-in who has used the app before already has a name, a number and an
   * address in the system. Retyping all of that produces a second version of
   * the same person — one their order history will never join up with, and one
   * whose address cannot be delivered to. This is how staff find the account
   * they already have instead.
   */
  async index({ request, response }: HttpContext) {
    const customers = await this.orderService.searchCustomers(String(request.qs().search ?? ''))

    return response.json({
      customers: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
      })),
    })
  }
}

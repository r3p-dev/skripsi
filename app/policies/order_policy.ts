import Order from '#models/order'
import type User from '#models/user'
import { Role } from '#enums/role_enum'
import { BasePolicy } from '@adonisjs/bouncer'

export default class OrderPolicy extends BasePolicy {
  static readonly INTERNAL_ROLES: readonly string[] = [Role.STAFF, Role.ADMIN]

  view(user: User, order: Order): boolean {
    return this.#isInternal(user) || order.userId === user.id
  }

  async subscribe(user: User, orderNumber: string): Promise<boolean> {
    if (this.#isInternal(user)) {
      return true
    }

    const order = await Order.findBy('order_number', orderNumber)

    return !!order && this.view(user, order)
  }

  #isInternal(user: User): boolean {
    return OrderPolicy.INTERNAL_ROLES.includes(user.role)
  }
}

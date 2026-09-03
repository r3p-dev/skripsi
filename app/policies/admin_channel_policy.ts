import type User from '#models/user'
import { Role } from '#enums/role_enum'
import { BasePolicy } from '@adonisjs/bouncer'

export default class AdminChannelPolicy extends BasePolicy {
  subscribe(user: User): boolean {
    return user.role === Role.ADMIN
  }
}

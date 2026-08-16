import Order from '#models/order'
import User from '#models/user'
import { Role, RoleLabel } from '#enums/role_enum'
import { type UserData } from '#validators/user_validator'
import { type AdminUserData } from '#validators/admin_validator'
import { errors as vineErrors } from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'

export type UserFilters = {
  search: string
  page: number
  role: string
}

export default class UserService {
  async getAllUsers(page: number): Promise<User[]> {
    return User.query().orderBy('created_at', 'desc').paginate(page, 10)
  }

  async getUserById(id: number): Promise<User | null> {
    return User.find(id)
  }

  async findUserOrFail(id: number): Promise<User> {
    return User.findOrFail(id)
  }

  async createAccount(data: UserData): Promise<User> {
    return User.create(data)
  }

  async updateAccount(id: number, data: UserData): Promise<User> {
    const user = await User.findOrFail(id)

    await user.merge(data).save()

    return user
  }

  async list(filters: UserFilters) {
    const query = User.query().orderBy('created_at', 'desc')

    if (filters.role) {
      query.where('role', filters.role)
    }

    if (filters.search) {
      query.where((builder) => {
        builder
          .whereILike('name', `%${filters.search}%`)
          .orWhereILike('phone', `%${filters.search}%`)
      })
    }

    return query.paginate(filters.page, 10)
  }

  async roleCounts(): Promise<Record<string, number>> {
    const rows = await db.from('users').select('role').count('* as total').groupBy('role')

    return Object.fromEntries(rows.map((row) => [row.role, Number(row.total)]))
  }

  /**
   * Accounts that cannot be removed because orders point at them. Deleting one
   * would orphan a customer's history, so the UI hides the button instead.
   */
  async undeletableIds(users: User[]): Promise<number[]> {
    const ids = users.map((user) => user.id)

    if (ids.length === 0) {
      return []
    }

    const rows = await db.from('orders').whereIn('user_id', ids).distinct('user_id')

    return rows.map((row) => Number(row.user_id))
  }

  /**
   * Updates an account from the admin screen. The password is only rewritten
   * when one was actually typed, so saving a name does not reset a login.
   */
  async updateFromAdmin(id: number, data: AdminUserData): Promise<User> {
    const user = await User.findOrFail(id)

    user.merge({
      name: data.name,
      phone: data.phone,
      role: data.role,
      isActive: data.isActive ?? false,
    })

    if (data.password) {
      user.password = data.password
      user.passwordChangedAt = null
    }

    await user.save()

    return user
  }

  async deleteAccount(actor: User, id: number): Promise<void> {
    if (actor.id === id) {
      throw new vineErrors.E_VALIDATION_ERROR([
        { field: 'form', message: 'Anda tidak dapat menghapus akun Anda sendiri.' },
      ])
    }

    const user = await User.findOrFail(id)
    const orders = await Order.query().where('user_id', user.id).count('* as total')

    if (Number(orders[0].$extras.total) > 0) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'form',
          message: 'Akun ini memiliki riwayat pesanan dan tidak dapat dihapus.',
        },
      ])
    }

    await user.delete()
  }

  /**
   * Every role a new account may be given, for the admin form.
   */
  roleOptions() {
    return Object.values(Role).map((role) => ({ value: role, label: RoleLabel[role] }))
  }
}

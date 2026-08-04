import { Role } from '#enums/role_enum'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import User from '#models/user'
import { EXPORT_ROW_LIMIT } from '#services/excel_service'
import type { CreateUserData, UpdateUserData } from '#validators/user_validator'
import type { Filters } from '#validators/shared'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { errors as vineErrors } from '@vinejs/vine'

export type RoleCounts = Record<Role, number>

/**
 * Manages the accounts an admin can see and edit: customers who signed
 * themselves up, and the staff and admin accounts that have no signup path of
 * their own and must be created here.
 */
export default class UserService {
  /**
   * Lists accounts, newest first, optionally narrowed to one role and
   * searched by name or phone number.
   */
  async getAllUsers(filters: Filters, role?: Role): Promise<ModelPaginatorContract<User>> {
    return this.allUsersQuery(filters, role).paginate(filters.page, 10)
  }

  /**
   * The same list, unpaginated, for the spreadsheet export — the file follows
   * whichever role tab and search the admin is looking at.
   */
  async getAllUsersForExport(filters: Filters, role?: Role): Promise<User[]> {
    return this.allUsersQuery(filters, role).limit(EXPORT_ROW_LIMIT)
  }

  private allUsersQuery(filters: Filters, role?: Role) {
    const searchTerm = `%${filters.search}%`

    return User.query()
      .if(role, (query) => {
        query.where('role', role!)
      })
      .if(filters.search, (query) => {
        query.where((matches) => {
          matches.whereILike('name', searchTerm).orWhereILike('phone', searchTerm)
        })
      })
      .orderBy('created_at', 'desc')
  }

  /**
   * How many accounts exist per role, for the tab counters on the list page.
   */
  async getRoleCounts(): Promise<RoleCounts> {
    const rows = await User.query().select('role').count('* as total').groupBy('role')
    const totals = new Map(rows.map((row) => [row.role, Number(row.$extras.total)]))

    return {
      [Role.CUSTOMER]: totals.get(Role.CUSTOMER) ?? 0,
      [Role.STAFF]: totals.get(Role.STAFF) ?? 0,
      [Role.ADMIN]: totals.get(Role.ADMIN) ?? 0,
    }
  }

  async getUser(id: number): Promise<User> {
    return User.findOrFail(id)
  }

  /**
   * Creates an account of any role.
   *
   * This is the only way a staff or admin account comes into existence:
   * `AuthService.signup` always produces a customer, deliberately, so that the
   * public form cannot mint privileged accounts.
   */
  async createUser(data: CreateUserData): Promise<User> {
    return User.create({
      name: data.name,
      phone: data.phone,
      password: data.password,
      role: data.role,
      isActive: true,
    })
  }

  /**
   * Updates an account, leaving the password alone unless a new one was typed.
   *
   * An admin may neither change their own role nor switch their own account
   * off. Both are one-way doors: the moment either saved, the next request
   * would be bounced out of the admin area, possibly leaving the shop with
   * nobody who can get back in.
   *
   * Switching somebody else off is how a staff member stops working here. It
   * takes effect on their very next request rather than when their session
   * happens to lapse, and none of the work attributed to them moves or
   * disappears — see `AuthMiddleware`.
   */
  async updateUser(admin: User, id: number, data: UpdateUserData): Promise<User> {
    const user = await this.getUser(id)
    const isActive = data.isActive ?? true

    if (user.id === admin.id && data.role !== user.role) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'role',
          message: 'Anda tidak dapat mengubah peran akun Anda sendiri.',
        },
      ])
    }

    if (user.id === admin.id && !isActive) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'isActive',
          message: 'Anda tidak dapat menonaktifkan akun Anda sendiri.',
        },
      ])
    }

    user.merge({
      name: data.name,
      phone: data.phone,
      role: data.role,
      isActive,
    })

    if (data.password) {
      user.password = data.password
    }

    return user.save()
  }

  /**
   * Deletes an account, refusing when it would take history with it.
   *
   * Orders and order actions both reference users with `RESTRICT`, so a
   * customer who has ordered or a staff member who has worked cannot be
   * removed — their name is part of the record of what happened. Deleting
   * yourself is refused for the same reason as demoting yourself.
   */
  async deleteUser(admin: User, id: number): Promise<User> {
    const user = await this.getUser(id)

    if (user.id === admin.id) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'id',
          message: 'Anda tidak dapat menghapus akun Anda sendiri.',
        },
      ])
    }

    if (await this.hasHistory(user)) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'id',
          message: 'Akun ini sudah memiliki riwayat pesanan dan tidak dapat dihapus.',
        },
      ])
    }

    await user.related('addresses').query().delete()
    await user.delete()

    return user
  }

  /**
   * Whether anything in the order record still names this account.
   */
  async hasHistory(user: User): Promise<boolean> {
    const [orders, actions] = await Promise.all([
      Order.query().where('user_id', user.id).count('* as total'),
      OrderAction.query().where('staff_id', user.id).count('* as total'),
    ])

    return Number(orders[0].$extras.total) > 0 || Number(actions[0].$extras.total) > 0
  }

  /**
   * The ids of the accounts on this page that can no longer be deleted, so
   * the list can disable the button instead of letting an admin find out by
   * being refused.
   */
  async getUndeletableIds(users: User[]): Promise<number[]> {
    if (users.length === 0) {
      return []
    }

    const ids = users.map((user) => user.id)

    const [orders, actions] = await Promise.all([
      Order.query().whereIn('user_id', ids).distinct('user_id').select('user_id'),
      OrderAction.query().whereIn('staff_id', ids).distinct('staff_id').select('staff_id'),
    ])

    return [
      ...new Set([
        ...orders.map((order) => order.userId!),
        ...actions.map((action) => action.staffId),
      ]),
    ]
  }
}

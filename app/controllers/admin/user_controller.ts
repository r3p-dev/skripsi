import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { Role, RoleLabel } from '#enums/role_enum'
import type User from '#models/user'
import ExcelService, {
  DATETIME_FORMAT,
  excelDate,
  sheet,
  type Column,
} from '#services/excel_service'
import UserService from '#services/user_service'
import UserTransformer from '#transformers/user_transformer'
import { createUserValidator, updateUserValidator } from '#validators/user_validator'
import type { Filters } from '#validators/shared'

const ROLE_OPTIONS = Object.values(Role).map((role) => ({
  value: role,
  label: RoleLabel[role],
}))

/**
 * What the spreadsheet says about an account.
 *
 * The password hash is not a column and must never become one: an export is a
 * file that leaves the server, gets mailed around and sits in a downloads
 * folder, which is the last place a credential belongs.
 */
const USER_COLUMNS: Column<User>[] = [
  { header: 'Nama', width: 28, value: (account) => account.name },
  { header: 'Telepon', width: 16, value: (account) => account.phone },
  { header: 'Peran', width: 14, value: (account) => RoleLabel[account.role as Role] },
  {
    header: 'Bergabung',
    width: 18,
    format: DATETIME_FORMAT,
    value: (account) => excelDate(account.createdAt),
  },
]

@inject()
export default class UserController {
  constructor(
    protected userService: UserService,
    protected excelService: ExcelService
  ) {}

  async index({ request, inertia }: HttpContext) {
    const query = request.qs()

    const filters = this.filtersFrom(query)
    const role = this.roleFrom(query)

    const users = await this.userService.getAllUsers(filters, role)

    return inertia.render('admin/user/index', {
      users: UserTransformer.paginate(users.all(), users.getMeta()),
      filters,
      role: role ?? '',
      roleCounts: await this.userService.getRoleCounts(),
      roleOptions: ROLE_OPTIONS,
      /**
       * Accounts that already appear in the order record. Deleting one is
       * refused by the service, so the list disables the button rather than
       * offering an action that cannot succeed.
       */
      undeletableIds: await this.userService.getUndeletableIds(users.all()),
    })
  }

  /**
   * The account list as a spreadsheet, following the same role tab and search
   * the page is showing.
   */
  async export({ request, response }: HttpContext) {
    const query = request.qs()

    const users = await this.userService.getAllUsersForExport(
      this.filtersFrom(query),
      this.roleFrom(query)
    )

    return this.excelService.download(response, 'pengguna', [
      sheet({ name: 'Pengguna', columns: USER_COLUMNS, rows: users }),
    ])
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('admin/user/create', {
      roleOptions: ROLE_OPTIONS,
    })
  }

  async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(createUserValidator)

    const user = await this.userService.createUser(payload)

    session.flash('success', `Akun ${user.name} berhasil dibuat.`)
    return response.redirect().toRoute('admin.user.index')
  }

  async edit({ auth, params, inertia }: HttpContext) {
    const admin = auth.getUserOrFail()
    const user = await this.userService.getUser(Number(params.id))

    return inertia.render('admin/user/edit', {
      account: UserTransformer.transform(user),
      roleOptions: ROLE_OPTIONS,
      /**
       * An admin editing their own account cannot change its role — see
       * `UserService.updateUser` for why that door only opens one way.
       */
      isSelf: user.id === admin.id,
    })
  }

  async update({ auth, params, request, response, session }: HttpContext) {
    const admin = auth.getUserOrFail()
    const id = Number(params.id)

    const payload = await request.validateUsing(updateUserValidator, {
      meta: { userId: id },
    })

    const user = await this.userService.updateUser(admin, id, payload)

    session.flash('success', `Akun ${user.name} berhasil diperbarui.`)
    return response.redirect().toRoute('admin.user.index')
  }

  async destroy({ auth, params, response, session }: HttpContext) {
    const admin = auth.getUserOrFail()

    const user = await this.userService.deleteUser(admin, Number(params.id))

    session.flash('success', `Akun ${user.name} berhasil dihapus.`)
    return response.redirect().toRoute('admin.user.index')
  }

  private filtersFrom(query: Record<string, unknown>): Filters {
    return {
      page: Number(query.page) || 1,
      search: String(query.search ?? '').trim(),
    }
  }

  /**
   * An unrecognised role in the query string means "all", the same as no role
   * at all, rather than an empty list under a tab that does not exist.
   */
  private roleFrom(query: Record<string, unknown>): Role | undefined {
    const requested = String(query.role ?? '')

    return Object.values(Role).includes(requested as Role) ? (requested as Role) : undefined
  }
}

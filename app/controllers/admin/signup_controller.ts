import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { Role, RoleLabel, PRIVILEGED_ROLES } from '#enums/role_enum'
import UserService from '#services/user_service'
import { staffSignupValidator } from '#validators/user_validator'

/**
 * The roles this form may hand out. Built from the shared list rather than
 * typed out, so it cannot drift from the rule the validator enforces.
 */
const ROLE_OPTIONS = PRIVILEGED_ROLES.map((role) => ({
  value: role,
  label: RoleLabel[role as Role],
}))

/**
 * Registration for the people who work here.
 *
 * The public sign-up form only ever produces customers, on purpose — a form
 * anyone on the internet can reach must not be able to mint an account that
 * can read the shop's takings. So staff and admin accounts get their own
 * sign-up, and it sits behind the admin area: an administrator is the only
 * person who can open it and the only person who can submit it.
 */
@inject()
export default class SignupController {
  constructor(protected userService: UserService) {}

  async create({ inertia }: HttpContext) {
    return inertia.render('admin/signup', {
      roleOptions: ROLE_OPTIONS,
    })
  }

  async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(staffSignupValidator)

    const user = await this.userService.createUser({
      ...payload,
      role: payload.role as Role,
    })

    session.flash('success', `Akun ${RoleLabel[user.role as Role]} ${user.name} berhasil dibuat.`)
    return response.redirect().toRoute('admin.user.index')
  }
}

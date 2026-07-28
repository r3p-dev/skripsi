import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { Role } from '#enums/role_enum'
import User from '#models/user'

/**
 * The starting admin account.
 *
 * There is no signup path for it on purpose — `AuthService.signup` always
 * creates a customer, so the public form can never mint a privileged account.
 * That left the admin area unreachable on a fresh database until now.
 *
 * Change the password immediately after the first sign-in; every other admin
 * and staff account is created from the admin user screen.
 */
const ADMIN = {
  name: 'Admin UmimaClean',
  phone: '081200000001',
  password: 'admin12345',
}

export default class extends BaseSeeder {
  async run() {
    /**
     * Matched on the phone number, which is the login identity, so re-running
     * the seeder against a live database refuses rather than adding a second
     * admin or resetting the password of the real one.
     */
    const existing = await User.findBy('phone', ADMIN.phone)

    if (existing) {
      return
    }

    await User.create({ ...ADMIN, role: Role.ADMIN })
  }
}

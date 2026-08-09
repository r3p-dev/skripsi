import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { Role } from '#enums/role_enum'
import User from '#models/user'

const ADMIN = {
  name: 'Admin UmimaClean',
  phone: '081200000001',
  password: 'admin12345',
}

export default class extends BaseSeeder {
  async run() {
    const existing = await User.findBy('phone', ADMIN.phone)

    if (existing) {
      return
    }

    await User.create({ ...ADMIN, role: Role.ADMIN })
  }
}

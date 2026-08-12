import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { Role } from '#enums/role_enum'
import User from '#models/user'

const USERS = [
  {
    name: 'Admin UmimaClean',
    phone: '085157900974',
    password: 'admin12345',
    role: Role.ADMIN,
  },
  {
    name: 'Staff UmimaClean',
    phone: '087777846518',
    password: 'staff12345',
    role: Role.STAFF,
  },
  {
    name: 'Customer UmimaClean',
    phone: '081313293859',
    password: 'customer12345',
    role: Role.CUSTOMER,
  },
]

export default class extends BaseSeeder {
  async run() {
    for (const user of USERS) {
      const existing = await User.findBy('phone', user.phone)

      if (!existing) {
        await User.create({ ...user })
      }
    }
  }
}

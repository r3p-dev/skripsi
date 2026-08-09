import User from '#models/user'
import { type UserData } from '#validators/user_validator'

export default class UserService {
  async getAllUsers(page: number): Promise<User[]> {
    return User.query().orderBy('created_at', 'desc').paginate(page, 10)
  }

  async getUserById(id: number): Promise<User | null> {
    return User.find(id)
  }

  async createAccount(data: UserData): Promise<User> {
    return User.create(data)
  }

  async updateAccount(id: number, data: UserData): Promise<User> {
    const user = await User.findOrFail(id)

    await user.merge(data).save()

    return user
  }
}

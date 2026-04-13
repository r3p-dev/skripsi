import { NotificationSchema } from '#database/schema'
import Tables from '#enums/table_enum'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.ts'

export default class Notification extends NotificationSchema {
  static table = Tables.NOTIFICATIONS

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>
}

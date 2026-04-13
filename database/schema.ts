import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export class AddressSchema extends BaseModel {
  static $columns = [
    'createdAt',
    'id',
    'isActive',
    'latitude',
    'longitude',
    'name',
    'note',
    'phone',
    'radius',
    'street',
    'updatedAt',
    'userId',
  ] as const
  $columns = AddressSchema.$columns
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare isActive: boolean
  @column()
  declare latitude: number
  @column()
  declare longitude: number
  @column()
  declare name: string
  @column()
  declare note: string | null
  @column()
  declare phone: string
  @column()
  declare radius: number
  @column()
  declare street: string
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
  @column()
  declare userId: number
}

export class DiscountSchema extends BaseModel {
  static $columns = [
    'amount',
    'code',
    'createdAt',
    'expiredAt',
    'id',
    'isActive',
    'maxDiscount',
    'minTotalPrice',
    'type',
    'updatedAt',
  ] as const
  $columns = DiscountSchema.$columns
  @column()
  declare amount: number
  @column()
  declare code: string
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column.dateTime()
  declare expiredAt: DateTime
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare isActive: boolean
  @column()
  declare maxDiscount: number
  @column()
  declare minTotalPrice: number
  @column()
  declare type: number
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}

export class NotificationSchema extends BaseModel {
  static $columns = [
    'createdAt',
    'id',
    'isRead',
    'message',
    'title',
    'type',
    'updatedAt',
    'userId',
  ] as const
  $columns = NotificationSchema.$columns
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare isRead: boolean
  @column()
  declare message: string
  @column()
  declare title: string
  @column()
  declare type: string
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
  @column()
  declare userId: number
}

export class OrderActionSchema extends BaseModel {
  static $columns = ['createdAt', 'id', 'name', 'note', 'orderId', 'staffId', 'updatedAt'] as const
  $columns = OrderActionSchema.$columns
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare name: number
  @column()
  declare note: string | null
  @column()
  declare orderId: number
  @column()
  declare staffId: number
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}

export class OrderItemSchema extends BaseModel {
  static $columns = [
    'createdAt',
    'id',
    'name',
    'orderId',
    'price',
    'serviceId',
    'shoeId',
    'subtotal',
    'updatedAt',
  ] as const
  $columns = OrderItemSchema.$columns
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare name: string
  @column()
  declare orderId: number
  @column()
  declare price: number
  @column()
  declare serviceId: number
  @column()
  declare shoeId: number
  @column()
  declare subtotal: number
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}

export class OrderSchema extends BaseModel {
  static $columns = [
    'addressId',
    'claimedBy',
    'createdAt',
    'date',
    'deliveryAt',
    'deliveryPhotoPath',
    'discountAmount',
    'discountId',
    'id',
    'inspectionAt',
    'inspectionPhotoPath',
    'number',
    'paymentStatus',
    'pickupAt',
    'pickupPhotoPath',
    'status',
    'subtotalPrice',
    'totalPrice',
    'type',
    'updatedAt',
    'userId',
  ] as const
  $columns = OrderSchema.$columns
  @column()
  declare addressId: number | null
  @column()
  declare claimedBy: number | null
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column.date()
  declare date: DateTime
  @column.dateTime()
  declare deliveryAt: DateTime | null
  @column()
  declare deliveryPhotoPath: string | null
  @column()
  declare discountAmount: number
  @column()
  declare discountId: number | null
  @column({ isPrimary: true })
  declare id: number
  @column.dateTime()
  declare inspectionAt: DateTime | null
  @column()
  declare inspectionPhotoPath: string | null
  @column()
  declare number: string
  @column()
  declare paymentStatus: number
  @column.dateTime()
  declare pickupAt: DateTime | null
  @column()
  declare pickupPhotoPath: string | null
  @column()
  declare status: number
  @column()
  declare subtotalPrice: number
  @column()
  declare totalPrice: number
  @column()
  declare type: number
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
  @column()
  declare userId: number
}

export class PushNotificationSchema extends BaseModel {
  static $columns = [
    'auth',
    'createdAt',
    'endpoint',
    'id',
    'p256Dh',
    'updatedAt',
    'userId',
  ] as const
  $columns = PushNotificationSchema.$columns
  @column()
  declare auth: string
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column()
  declare endpoint: string
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare p256Dh: string
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
  @column()
  declare userId: number
}

export class RateLimitSchema extends BaseModel {
  static $columns = ['expire', 'key', 'points'] as const
  $columns = RateLimitSchema.$columns
  @column()
  declare expire: bigint | number | null
  @column({ isPrimary: true })
  declare key: string
  @column()
  declare points: number
}

export class RememberMeTokenSchema extends BaseModel {
  static $columns = ['createdAt', 'expiresAt', 'hash', 'id', 'tokenableId', 'updatedAt'] as const
  $columns = RememberMeTokenSchema.$columns
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column.dateTime()
  declare expiresAt: DateTime
  @column()
  declare hash: string
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare tokenableId: number
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

export class ReviewSchema extends BaseModel {
  static $columns = [
    'comment',
    'createdAt',
    'id',
    'orderId',
    'rating',
    'updatedAt',
    'userId',
  ] as const
  $columns = ReviewSchema.$columns
  @column()
  declare comment: string | null
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare orderId: number
  @column()
  declare rating: number
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
  @column()
  declare userId: number
}

export class ServiceSchema extends BaseModel {
  static $columns = [
    'createdAt',
    'description',
    'id',
    'name',
    'price',
    'type',
    'updatedAt',
  ] as const
  $columns = ServiceSchema.$columns
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column()
  declare description: string
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare name: string
  @column()
  declare price: number
  @column()
  declare type: number
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}

export class ShoeSchema extends BaseModel {
  static $columns = [
    'brand',
    'category',
    'condition',
    'createdAt',
    'id',
    'material',
    'note',
    'orderId',
    'size',
    'type',
    'updatedAt',
  ] as const
  $columns = ShoeSchema.$columns
  @column()
  declare brand: string
  @column()
  declare category: string
  @column()
  declare condition: string
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare material: string
  @column()
  declare note: string | null
  @column()
  declare orderId: number
  @column()
  declare size: number
  @column()
  declare type: string
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}

export class TransactionSchema extends BaseModel {
  static $columns = [
    'amount',
    'createdAt',
    'expiredAt',
    'id',
    'midtransCode',
    'midtransOrderId',
    'orderId',
    'paidAt',
    'paymentMethod',
    'status',
    'type',
    'updatedAt',
  ] as const
  $columns = TransactionSchema.$columns
  @column()
  declare amount: number
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column.dateTime()
  declare expiredAt: DateTime
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare midtransCode: string | null
  @column()
  declare midtransOrderId: string | null
  @column()
  declare orderId: number
  @column.dateTime()
  declare paidAt: DateTime | null
  @column()
  declare paymentMethod: number
  @column()
  declare status: number
  @column()
  declare type: number
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}

export class UserSchema extends BaseModel {
  static $columns = [
    'createdAt',
    'id',
    'isActive',
    'isRegistered',
    'name',
    'password',
    'phone',
    'role',
    'updatedAt',
  ] as const
  $columns = UserSchema.$columns
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare isActive: boolean
  @column()
  declare isRegistered: boolean
  @column()
  declare name: string
  @column({ serializeAs: null })
  declare password: string
  @column()
  declare phone: string
  @column()
  declare role: number
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}

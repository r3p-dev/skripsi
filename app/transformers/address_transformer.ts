import { BaseTransformer } from '@adonisjs/core/transformers'
import type Address from '#models/address'
import { DateTime } from 'luxon'
import UserTransformer from '#transformers/user_transformer'

export default class AddressTransformer extends BaseTransformer<Address> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'phone', 'street', 'note']),

      latitude: Number(this.resource.latitude),
      longitude: Number(this.resource.longitude),
      isActive: Boolean(this.resource.isActive),
      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),

      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
    }
  }
}

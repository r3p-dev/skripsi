import type Address from '#models/address'
import { BaseTransformer } from '@adonisjs/core/transformers'
import UserTransformer from '#transformers/user_transformer'
import { DateTime } from 'luxon'

export default class AddressTransformer extends BaseTransformer<Address> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'phone', 'street', 'note']),

      latitude: Number(this.resource.latitude),
      longitude: Number(this.resource.longitude),
      isActive: Boolean(this.resource.isActive),

      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),
    }
  }

  toDetail() {
    return {
      ...this.toObject(),

      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
    }
  }
}

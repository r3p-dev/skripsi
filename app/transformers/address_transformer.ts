import type Address from '#models/address'
import UserTransformer from '#transformers/user_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class AddressTransformer extends BaseTransformer<Address> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'name',
        'phone',
        'street',
        'latitude',
        'longitude',
        'radius',
        'note',
        'isActive',
        'createdAt',
      ]),
      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
    }
  }
}

import type Review from '#models/review'
import UserTransformer from '#transformers/user_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ReviewTransformer extends BaseTransformer<Review> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'rating', 'comment', 'createdAt', 'updatedAt']),
      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
    }
  }
}

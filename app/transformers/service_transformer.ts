import type Service from '#models/service'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ServiceTransformer extends BaseTransformer<Service> {
  toObject() {
    return this.pick(this.resource, ['id', 'name', 'price', 'description', 'type', 'createdAt'])
  }
}

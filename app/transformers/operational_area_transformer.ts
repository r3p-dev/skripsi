import type OperationalArea from '#models/operational_area'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class OperationalAreaTransformer extends BaseTransformer<OperationalArea> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name']),

      geometry: this.resource.geometry,
    }
  }
}

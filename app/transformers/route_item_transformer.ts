import type { RouteItem } from '#services/task_service'
import { TaskTypeLabel } from '#enums/task_enum'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class RouteItemTransformer extends BaseTransformer<RouteItem> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'orderNumber', 'type']),

      typeLabel: TaskTypeLabel[this.resource.type],

      pickupDate: this.resource.pickupDate?.toISODate() ?? null,

      distanceKm: Number((this.resource.distanceMetres / 1000).toFixed(1)),
    }
  }
}

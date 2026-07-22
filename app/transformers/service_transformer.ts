import {
  type ServiceCategory,
  ServiceCategoryLabel,
  type ServiceType,
  ServiceTypeLabel,
} from '#enums/service_type_enum'
import type Service from '#models/service'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { DateTime } from 'luxon'
import { formatRupiah } from '#utils/currency'

/**
 * Serialize service models for API responses.
 */
export default class ServiceTransformer extends BaseTransformer<Service> {
  /**
   * Convert a service model into the public response payload.
   */
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'description']),

      category: ServiceCategoryLabel[this.resource.category as ServiceCategory],
      type: ServiceTypeLabel[this.resource.type as ServiceType],
      price: formatRupiah(this.resource.price),
      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),
    }
  }
}

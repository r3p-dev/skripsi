import type Service from '#models/service'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { DateTime } from 'luxon'
import {
  type ServiceCategory,
  ServiceCategoryLabel,
  type ServiceType,
  ServiceTypeLabel,
} from '#enums/service_enum'
import { formatRupiah } from '#utils/currency'

export default class ServiceTransformer extends BaseTransformer<Service> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'description']),

      category: ServiceCategoryLabel[this.resource.category as ServiceCategory],
      categoryValue: this.resource.category as ServiceCategory,
      type: ServiceTypeLabel[this.resource.type as ServiceType],
      price: formatRupiah(this.resource.price),
      createdAt: this.resource.createdAt.setLocale('id').toLocaleString(DateTime.DATE_FULL),
    }
  }
}

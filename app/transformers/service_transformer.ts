import type Service from '#models/service'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { DateTime } from 'luxon'

export default class ServiceTransformer extends BaseTransformer<Service> {
  /**
   * A catalogue entry's own columns.
   *
   * The price is the number, not "Rp 25.000". It used to be sent both ways at
   * once — a formatted `price` for the table and a `priceValue` for the edit
   * form — which is two names for one fact and an invitation to read the wrong
   * one. Money is formatted where it is printed.
   */
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'description']),

      category: this.resource.category,
      type: this.resource.type,
      price: Number(this.resource.price),
      createdAt: this.resource.createdAt.toLocaleString(DateTime.DATE_FULL),
    }
  }
}

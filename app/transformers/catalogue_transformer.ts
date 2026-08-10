import type Catalogue from '#models/catalogue'
import { CatalogueTypeLabel } from '#enums/catalogue_enum'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { formatRupiah } from '#utils/currency'

export default class CatalogueTransformer extends BaseTransformer<Catalogue> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'description', 'category']),

      type: this.resource.type,
      typeLabel: CatalogueTypeLabel[this.resource.type],

      price: Number(this.resource.price),
      priceLabel: formatRupiah(this.resource.price),
    }
  }
}

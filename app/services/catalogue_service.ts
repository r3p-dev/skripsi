import Catalogue from '#models/catalogue'
import {
  CatalogueCategory,
  CatalogueCategoryLabel,
  CatalogueType,
  CatalogueTypeLabel,
} from '#enums/catalogue_enum'
import { ItemType, ItemTypeCategories, ItemTypeLabel } from '#enums/item_enum'
import { type CatalogueData } from '#validators/catalogue_validator'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import db from '@adonisjs/lucid/services/db'
import { errors } from '@vinejs/vine'

export type CatalogueOption = {
  id: number
  name: string
  description: string
  price: string
  type: CatalogueType
}

export type ItemTypeOptions = {
  type: ItemType
  label: string
  catalogues: CatalogueOption[]
  additionalCatalogues: CatalogueOption[]
}

export type CatalogueSelection = {
  type: ItemType
  catalogue: number
  additionalCatalogues?: number[]
}

export default class CatalogueService {
  async getAllCatalogues(page: number): Promise<Catalogue[]> {
    return Catalogue.query().orderBy('created_at', 'desc').paginate(page, 10)
  }

  async getPublicCatalogues(): Promise<Catalogue[]> {
    return Catalogue.query().orderBy('price', 'asc')
  }

  async getCatalogueById(id: number): Promise<Catalogue | null> {
    return Catalogue.find(id)
  }

  async findCatalogueOrFail(id: number): Promise<Catalogue> {
    return Catalogue.findOrFail(id)
  }

  async list(filters: { search: string; page: number }) {
    const query = Catalogue.query().orderBy('created_at', 'desc')

    if (filters.search) {
      query.where((builder) => {
        builder
          .whereILike('name', `%${filters.search}%`)
          .orWhereILike('description', `%${filters.search}%`)
      })
    }

    return query.paginate(filters.page, 10)
  }

  /**
   * Catalogues already booked on an order. Their price is copied onto the order
   * line at the time of booking, but removing the row would still break the
   * link an admin follows back from a receipt, so deletion is blocked.
   */
  async inUseIds(catalogues: Catalogue[]): Promise<number[]> {
    const ids = catalogues.map((catalogue) => catalogue.id)

    if (ids.length === 0) {
      return []
    }

    const rows = await db.from('order_items').whereIn('catalogue_id', ids).distinct('catalogue_id')

    return rows.map((row) => Number(row.catalogue_id))
  }

  async deleteCatalogue(id: number): Promise<void> {
    const catalogue = await Catalogue.findOrFail(id)
    const booked = await db
      .from('order_items')
      .where('catalogue_id', catalogue.id)
      .count('* as total')
      .first()

    if (Number(booked?.total ?? 0) > 0) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'form',
          message: 'Layanan ini sudah pernah dipesan dan tidak dapat dihapus.',
        },
      ])
    }

    await catalogue.delete()
  }

  categoryOptions() {
    return Object.values(CatalogueCategory).map((category) => ({
      value: category,
      label: CatalogueCategoryLabel[category],
    }))
  }

  typeOptions() {
    return Object.values(CatalogueType).map((type) => ({
      value: type,
      label: CatalogueTypeLabel[type],
    }))
  }

  async createCatalogue(data: CatalogueData): Promise<Catalogue> {
    return Catalogue.create(this.#toAttributes(data))
  }

  async updateCatalogue(id: number, data: CatalogueData): Promise<Catalogue> {
    const catalogue = await Catalogue.findOrFail(id)

    await catalogue.merge(this.#toAttributes(data)).save()

    return catalogue
  }

  /**
   * The form field is called `catalogueName`, the column is called `name`.
   */
  #toAttributes({ catalogueName, price, ...rest }: CatalogueData) {
    return {
      ...rest,
      name: catalogueName,
      price: price.toString(),
    }
  }

  async getCatalogueOptions(): Promise<ItemTypeOptions[]> {
    const catalogues = await Catalogue.query().orderBy('price', 'asc')

    return Object.values(ItemType).map((type) => ({
      type,
      label: ItemTypeLabel[type],
      catalogues: catalogues
        .filter((catalogue) => this.#isCatalogueFor(catalogue, type))
        .map((catalogue) => this.#toCatalogueOption(catalogue)),
      additionalCatalogues: catalogues
        .filter((catalogue) => this.#isAdditionalCatalogueFor(catalogue, type))
        .map((catalogue) => this.#toCatalogueOption(catalogue)),
    }))
  }

  async resolveForSelections(
    selections: CatalogueSelection[],
    trx?: TransactionClientContract
  ): Promise<Map<number, Catalogue>> {
    const ids = [
      ...new Set(
        selections.flatMap((selection) => [
          selection.catalogue,
          ...(selection.additionalCatalogues ?? []),
        ])
      ),
    ]

    const catalogues = await Catalogue.query(trx ? { client: trx } : {}).whereIn('id', ids)
    const byId = new Map(catalogues.map((catalogue) => [catalogue.id, catalogue]))

    selections.forEach((selection, index) => {
      const label = ItemTypeLabel[selection.type].toLowerCase()
      const catalogue = byId.get(selection.catalogue)

      if (!catalogue || !this.#isCatalogueFor(catalogue, selection.type)) {
        this.#validationError(
          `items.${index}.catalogue`,
          `Layanan yang dipilih tidak tersedia untuk ${label}`
        )
      }

      selection.additionalCatalogues?.forEach((additionalId, additionalIndex) => {
        const additional = byId.get(additionalId)

        if (!additional || !this.#isAdditionalCatalogueFor(additional, selection.type)) {
          this.#validationError(
            `items.${index}.additionalCatalogues.${additionalIndex}`,
            `Layanan tambahan yang dipilih tidak tersedia untuk ${label}`
          )
        }
      })
    })

    return byId
  }

  #isCatalogueFor(catalogue: Catalogue, type: ItemType): boolean {
    return (
      catalogue.type !== CatalogueType.ADDITIONAL &&
      ItemTypeCategories[type].includes(catalogue.category)
    )
  }

  #isAdditionalCatalogueFor(catalogue: Catalogue, type: ItemType): boolean {
    return (
      catalogue.type === CatalogueType.ADDITIONAL &&
      (catalogue.category === CatalogueCategory.ADDITIONAL ||
        ItemTypeCategories[type].includes(catalogue.category))
    )
  }

  #toCatalogueOption(catalogue: Catalogue): CatalogueOption {
    return {
      id: catalogue.id,
      name: catalogue.name,
      description: catalogue.description,
      price: catalogue.price,
      type: catalogue.type,
    }
  }

  #validationError(field: string, message: string): never {
    throw new errors.E_VALIDATION_ERROR([{ field, message }])
  }
}

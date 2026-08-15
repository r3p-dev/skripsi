import Catalogue from '#models/catalogue'
import { CatalogueCategory, CatalogueType } from '#enums/catalogue_enum'
import { ItemType, ItemTypeCategories, ItemTypeLabel } from '#enums/item_enum'
import { type CatalogueData } from '#validators/catalogue_validator'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
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
  services: CatalogueOption[]
  additionalServices: CatalogueOption[]
}

export type ServiceSelection = {
  type: ItemType
  service: number
  additionalServices?: number[]
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

  async createCatalogue(data: CatalogueData): Promise<Catalogue> {
    return Catalogue.create(this.#toAttributes(data))
  }

  async updateCatalogue(id: number, data: CatalogueData): Promise<Catalogue> {
    const catalogue = await Catalogue.findOrFail(id)

    await catalogue.merge(this.#toAttributes(data)).save()

    return catalogue
  }

  /**
   * The form field is called `serviceName`, the column is called `name`.
   */
  #toAttributes({ serviceName, price, ...rest }: CatalogueData) {
    return {
      ...rest,
      name: serviceName,
      price: price.toString(),
    }
  }

  async getServiceOptions(): Promise<ItemTypeOptions[]> {
    const catalogues = await Catalogue.query().orderBy('price', 'asc')

    return Object.values(ItemType).map((type) => ({
      type,
      label: ItemTypeLabel[type],
      services: catalogues
        .filter((catalogue) => this.#isServiceFor(catalogue, type))
        .map((catalogue) => this.#toServiceOption(catalogue)),
      additionalServices: catalogues
        .filter((catalogue) => this.#isAdditionalServiceFor(catalogue, type))
        .map((catalogue) => this.#toServiceOption(catalogue)),
    }))
  }

  async resolveForSelections(
    selections: ServiceSelection[],
    trx?: TransactionClientContract
  ): Promise<Map<number, Catalogue>> {
    const ids = [
      ...new Set(
        selections.flatMap((selection) => [
          selection.service,
          ...(selection.additionalServices ?? []),
        ])
      ),
    ]

    const catalogues = await Catalogue.query(trx ? { client: trx } : {}).whereIn('id', ids)
    const byId = new Map(catalogues.map((catalogue) => [catalogue.id, catalogue]))

    selections.forEach((selection, index) => {
      const label = ItemTypeLabel[selection.type].toLowerCase()
      const service = byId.get(selection.service)

      if (!service || !this.#isServiceFor(service, selection.type)) {
        this.#validationError(
          `items.${index}.service`,
          `Layanan yang dipilih tidak tersedia untuk ${label}`
        )
      }

      selection.additionalServices?.forEach((additionalId, additionalIndex) => {
        const additional = byId.get(additionalId)

        if (!additional || !this.#isAdditionalServiceFor(additional, selection.type)) {
          this.#validationError(
            `items.${index}.additionalServices.${additionalIndex}`,
            `Layanan tambahan yang dipilih tidak tersedia untuk ${label}`
          )
        }
      })
    })

    return byId
  }

  #isServiceFor(catalogue: Catalogue, type: ItemType): boolean {
    return (
      catalogue.type !== CatalogueType.ADDITIONAL &&
      ItemTypeCategories[type].includes(catalogue.category)
    )
  }

  #isAdditionalServiceFor(catalogue: Catalogue, type: ItemType): boolean {
    return (
      catalogue.type === CatalogueType.ADDITIONAL &&
      (catalogue.category === CatalogueCategory.ADDITIONAL ||
        ItemTypeCategories[type].includes(catalogue.category))
    )
  }

  #toServiceOption(catalogue: Catalogue): CatalogueOption {
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

import Catalogue from '#models/catalogue'
import factory from '@adonisjs/lucid/factories'
import { CatalogueCategory, CatalogueType } from '#enums/catalogue_enum'
import { nextSequence } from '#database/factories/support'

export const CatalogueFactory = factory
  .define(Catalogue, ({ faker }) => ({
    name: `Layanan Uji ${nextSequence()}`,
    description: faker.lorem.sentence(),
    price: String(faker.number.int({ min: 20, max: 200 }) * 1000),
    category: CatalogueCategory.SHOE_WASH,
    type: CatalogueType.REGULAR,
  }))
  .state('shoeWash', (catalogue) => {
    catalogue.category = CatalogueCategory.SHOE_WASH
  })
  .state('shoeRepair', (catalogue) => {
    catalogue.category = CatalogueCategory.SHOE_REPAIR
  })
  .state('bagWash', (catalogue) => {
    catalogue.category = CatalogueCategory.BAG_WASH
  })
  .state('helmetWash', (catalogue) => {
    catalogue.category = CatalogueCategory.HELMET_WASH
  })
  .state('startFrom', (catalogue) => {
    catalogue.type = CatalogueType.START_FROM
  })
  .state('additional', (catalogue) => {
    catalogue.type = CatalogueType.ADDITIONAL
  })
  .build()

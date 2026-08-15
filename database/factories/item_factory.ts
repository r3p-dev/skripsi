import Item from '#models/item'
import factory from '@adonisjs/lucid/factories'
import type { Faker } from '@faker-js/faker'
import { ItemType } from '#enums/item_enum'
import { OrderFactory } from '#database/factories/order_factory'

type ItemSample = {
  brand: string[]
  model: string[]
  size: string[]
  material: string[]
}

const SAMPLES: Record<ItemType, ItemSample> = {
  [ItemType.SHOE]: {
    brand: ['Nike', 'Adidas', 'Compass', 'Ventela'],
    model: ['Air Force 1', 'Samba', 'Gazelle Low', 'Public High'],
    size: ['39', '40', '41', '42', '43'],
    material: ['Kanvas', 'Kulit', 'Suede', 'Mesh'],
  },
  [ItemType.BAG]: {
    brand: ['Eiger', 'Consina', 'Bodypack', 'Herschel'],
    model: ['Daypack 20L', 'Sling Bag', 'Tote', 'Ransel Laptop'],
    size: ['S', 'M', 'L'],
    material: ['Kanvas', 'Nilon', 'Kulit Sintetis'],
  },
  [ItemType.HELMET]: {
    brand: ['Shoei', 'KYT', 'NHK', 'Arai'],
    model: ['GT Air', 'TT Course', 'RX9', 'Astro GX'],
    size: ['M', 'L', 'XL'],
    material: ['Fiberglass', 'Polikarbonat', 'Komposit'],
  },
}

export function itemAttributes(faker: Faker, type: ItemType) {
  const sample = SAMPLES[type]

  return {
    type,
    brand: faker.helpers.arrayElement(sample.brand),
    model: faker.helpers.arrayElement(sample.model),
    size: faker.helpers.arrayElement(sample.size),
    material: faker.helpers.arrayElement(sample.material),
    note: null,
  }
}

export const ItemFactory = factory
  .define(Item, ({ faker }) =>
    itemAttributes(faker, faker.helpers.arrayElement(Object.values(ItemType)))
  )
  .state('shoe', (item, { faker }) => item.merge(itemAttributes(faker, ItemType.SHOE)))
  .state('bag', (item, { faker }) => item.merge(itemAttributes(faker, ItemType.BAG)))
  .state('helmet', (item, { faker }) => item.merge(itemAttributes(faker, ItemType.HELMET)))
  .relation('order', () => OrderFactory)
  .build()

import { test } from '@japa/runner'
import Catalogue from '#models/catalogue'
import CatalogueService from '#services/catalogue_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { CatalogueCategory, CatalogueType } from '#enums/catalogue_enum'
import { ItemType } from '#enums/item_enum'
import { CatalogueFactory } from '#database/factories/catalogue_factory'
import { validationMessages } from '#tests/utils/helpers'

const catalogueService = new CatalogueService()

test.group('CatalogueService | the price list', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates an entry with the price stored as text', async ({ assert }) => {
    const catalogue = await catalogueService.createCatalogue({
      serviceName: 'Cuci Kilat',
      description: 'Selesai dalam satu hari',
      price: 75_000,
      category: CatalogueCategory.SHOE_WASH,
      type: CatalogueType.REGULAR,
    })

    const stored = await Catalogue.findOrFail(catalogue.id)

    assert.equal(Number(stored.price), 75_000)
    assert.equal(stored.category, CatalogueCategory.SHOE_WASH)
  })

  test('updates an existing entry', async ({ assert }) => {
    const catalogue = await CatalogueFactory.create()

    await catalogueService.updateCatalogue(catalogue.id, {
      serviceName: 'Cuci Kilat',
      description: 'Deskripsi diperbarui',
      price: 99_000,
      category: CatalogueCategory.BAG_WASH,
      type: CatalogueType.START_FROM,
    })

    const stored = await Catalogue.findOrFail(catalogue.id)

    assert.equal(Number(stored.price), 99_000)
    assert.equal(stored.description, 'Deskripsi diperbarui')
    assert.equal(stored.category, CatalogueCategory.BAG_WASH)
    assert.equal(stored.type, CatalogueType.START_FROM)
  })

  test('refuses to update an entry that does not exist', async ({ assert }) => {
    await assert.rejects(() =>
      catalogueService.updateCatalogue(9_999_999, {
        serviceName: 'Tidak Ada',
        description: 'Tidak Ada',
        price: 1000,
        category: CatalogueCategory.SHOE_WASH,
        type: CatalogueType.REGULAR,
      })
    )
  })

  test('finds an entry by id, and nothing for a missing one', async ({ assert }) => {
    const catalogue = await CatalogueFactory.create()

    const found = await catalogueService.getCatalogueById(catalogue.id)

    assert.equal(found?.id, catalogue.id)
    assert.isNull(await catalogueService.getCatalogueById(9_999_999))
  })

  test('the public list is ordered cheapest first', async ({ assert }) => {
    const catalogues = await catalogueService.getPublicCatalogues()
    const prices = catalogues.map((catalogue) => Number(catalogue.price))

    assert.deepEqual(
      prices,
      [...prices].sort((a, b) => a - b)
    )
  })
})

test.group('CatalogueService | options offered per kind of goods', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shoe services are offered for shoes and nothing else', async ({ assert }) => {
    const shoeWash = await CatalogueFactory.apply('shoeWash').create()

    const options = await catalogueService.getServiceOptions()
    const forType = (type: ItemType) => options.find((option) => option.type === type)!

    assert.include(
      forType(ItemType.SHOE).services.map((service) => service.id),
      shoeWash.id
    )
    assert.notInclude(
      forType(ItemType.BAG).services.map((service) => service.id),
      shoeWash.id
    )
    assert.notInclude(
      forType(ItemType.HELMET).services.map((service) => service.id),
      shoeWash.id
    )
  })

  test('shoe repair is offered alongside shoe washing', async ({ assert }) => {
    const repair = await CatalogueFactory.apply('shoeRepair').create()

    const options = await catalogueService.getServiceOptions()
    const shoes = options.find((option) => option.type === ItemType.SHOE)!

    assert.include(
      shoes.services.map((service) => service.id),
      repair.id
    )
  })

  test('an add-on is listed separately from the main services', async ({ assert }) => {
    const addOn = await CatalogueFactory.apply('shoeWash').apply('additional').create()

    const options = await catalogueService.getServiceOptions()
    const shoes = options.find((option) => option.type === ItemType.SHOE)!

    assert.include(
      shoes.additionalServices.map((service) => service.id),
      addOn.id
    )
    assert.notInclude(
      shoes.services.map((service) => service.id),
      addOn.id
    )
  })

  test('every kind of goods gets an entry with its Indonesian label', async ({ assert }) => {
    const options = await catalogueService.getServiceOptions()

    assert.deepEqual(
      options.map((option) => option.type),
      [ItemType.SHOE, ItemType.BAG, ItemType.HELMET]
    )
    assert.deepEqual(
      options.map((option) => option.label),
      ['Sepatu', 'Tas', 'Helm']
    )
  })

  test('options are ordered cheapest first', async ({ assert }) => {
    await CatalogueFactory.apply('helmetWash').merge({ price: '90000' }).create()
    await CatalogueFactory.apply('helmetWash').merge({ price: '20000' }).create()

    const options = await catalogueService.getServiceOptions()
    const prices = options
      .find((option) => option.type === ItemType.HELMET)!
      .services.map((service) => Number(service.price))

    assert.deepEqual(
      prices,
      [...prices].sort((a, b) => a - b)
    )
  })
})

test.group('CatalogueService | checking a customer selection', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('accepts a service that matches the goods', async ({ assert }) => {
    const wash = await CatalogueFactory.apply('helmetWash').create()

    const resolved = await catalogueService.resolveForSelections([
      { type: ItemType.HELMET, service: wash.id },
    ])

    assert.equal(resolved.get(wash.id)?.id, wash.id)
  })

  test('accepts an add-on that matches the goods', async ({ assert }) => {
    const wash = await CatalogueFactory.apply('bagWash').create()
    const addOn = await CatalogueFactory.apply('bagWash').apply('additional').create()

    const resolved = await catalogueService.resolveForSelections([
      { type: ItemType.BAG, service: wash.id, additionalServices: [addOn.id] },
    ])

    assert.equal(resolved.get(addOn.id)?.id, addOn.id)
  })

  test('rejects a service meant for different goods', async ({ assert }) => {
    const shoeWash = await CatalogueFactory.apply('shoeWash').create()

    const [failure] = await validationMessages(() =>
      catalogueService.resolveForSelections([{ type: ItemType.HELMET, service: shoeWash.id }])
    )

    assert.equal(failure.field, 'items.0.service')
    assert.match(failure.message, /tidak tersedia untuk helm/i)
  })

  test('rejects a service that does not exist', async ({ assert }) => {
    const [failure] = await validationMessages(() =>
      catalogueService.resolveForSelections([{ type: ItemType.SHOE, service: 9_999_999 }])
    )

    assert.equal(failure.field, 'items.0.service')
  })

  test('rejects an add-on that is really a main service', async ({ assert }) => {
    const wash = await CatalogueFactory.apply('shoeWash').create()
    const alsoWash = await CatalogueFactory.apply('shoeWash').create()

    const [failure] = await validationMessages(() =>
      catalogueService.resolveForSelections([
        { type: ItemType.SHOE, service: wash.id, additionalServices: [alsoWash.id] },
      ])
    )

    assert.equal(failure.field, 'items.0.additionalServices.0')
    assert.match(failure.message, /tidak tersedia untuk sepatu/i)
  })

  test('points at the offending item when several were selected', async ({ assert }) => {
    const shoeWash = await CatalogueFactory.apply('shoeWash').create()

    const [failure] = await validationMessages(() =>
      catalogueService.resolveForSelections([
        { type: ItemType.SHOE, service: shoeWash.id },
        { type: ItemType.BAG, service: shoeWash.id },
      ])
    )

    assert.equal(failure.field, 'items.1.service')
  })
})

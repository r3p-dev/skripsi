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
      catalogueName: 'Cuci Kilat',
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
      catalogueName: 'Cuci Kilat',
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
        catalogueName: 'Tidak Ada',
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

  test('shoe catalogues are offered for shoes and nothing else', async ({ assert }) => {
    const shoeWash = await CatalogueFactory.apply('shoeWash').create()

    const options = await catalogueService.getCatalogueOptions()
    const forType = (type: ItemType) => options.find((option) => option.type === type)!

    assert.include(
      forType(ItemType.SHOE).catalogues.map((catalogue) => catalogue.id),
      shoeWash.id
    )
    assert.notInclude(
      forType(ItemType.BAG).catalogues.map((catalogue) => catalogue.id),
      shoeWash.id
    )
    assert.notInclude(
      forType(ItemType.HELMET).catalogues.map((catalogue) => catalogue.id),
      shoeWash.id
    )
  })

  test('shoe repair is offered alongside shoe washing', async ({ assert }) => {
    const repair = await CatalogueFactory.apply('shoeRepair').create()

    const options = await catalogueService.getCatalogueOptions()
    const shoes = options.find((option) => option.type === ItemType.SHOE)!

    assert.include(
      shoes.catalogues.map((catalogue) => catalogue.id),
      repair.id
    )
  })

  test('an add-on is listed separately from the main catalogues', async ({ assert }) => {
    const addOn = await CatalogueFactory.apply('shoeWash').apply('additional').create()

    const options = await catalogueService.getCatalogueOptions()
    const shoes = options.find((option) => option.type === ItemType.SHOE)!

    assert.include(
      shoes.additionalCatalogues.map((catalogue) => catalogue.id),
      addOn.id
    )
    assert.notInclude(
      shoes.catalogues.map((catalogue) => catalogue.id),
      addOn.id
    )
  })

  test('every kind of goods gets an entry with its Indonesian label', async ({ assert }) => {
    const options = await catalogueService.getCatalogueOptions()

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

    const options = await catalogueService.getCatalogueOptions()
    const prices = options
      .find((option) => option.type === ItemType.HELMET)!
      .catalogues.map((catalogue) => Number(catalogue.price))

    assert.deepEqual(
      prices,
      [...prices].sort((a, b) => a - b)
    )
  })
})

test.group('CatalogueService | checking a customer selection', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('accepts a catalogue that matches the goods', async ({ assert }) => {
    const wash = await CatalogueFactory.apply('helmetWash').create()

    const resolved = await catalogueService.resolveForSelections([
      { type: ItemType.HELMET, catalogue: wash.id },
    ])

    assert.equal(resolved.get(wash.id)?.id, wash.id)
  })

  test('accepts an add-on that matches the goods', async ({ assert }) => {
    const wash = await CatalogueFactory.apply('bagWash').create()
    const addOn = await CatalogueFactory.apply('bagWash').apply('additional').create()

    const resolved = await catalogueService.resolveForSelections([
      { type: ItemType.BAG, catalogue: wash.id, additionalCatalogues: [addOn.id] },
    ])

    assert.equal(resolved.get(addOn.id)?.id, addOn.id)
  })

  test('rejects a catalogue meant for different goods', async ({ assert }) => {
    const shoeWash = await CatalogueFactory.apply('shoeWash').create()

    const [failure] = await validationMessages(() =>
      catalogueService.resolveForSelections([{ type: ItemType.HELMET, catalogue: shoeWash.id }])
    )

    assert.equal(failure.field, 'items.0.catalogue')
    assert.match(failure.message, /tidak tersedia untuk helm/i)
  })

  test('rejects a catalogue that does not exist', async ({ assert }) => {
    const [failure] = await validationMessages(() =>
      catalogueService.resolveForSelections([{ type: ItemType.SHOE, catalogue: 9_999_999 }])
    )

    assert.equal(failure.field, 'items.0.catalogue')
  })

  test('rejects an add-on that is really a main catalogue', async ({ assert }) => {
    const wash = await CatalogueFactory.apply('shoeWash').create()
    const alsoWash = await CatalogueFactory.apply('shoeWash').create()

    const [failure] = await validationMessages(() =>
      catalogueService.resolveForSelections([
        { type: ItemType.SHOE, catalogue: wash.id, additionalCatalogues: [alsoWash.id] },
      ])
    )

    assert.equal(failure.field, 'items.0.additionalCatalogues.0')
    assert.match(failure.message, /tidak tersedia untuk sepatu/i)
  })

  test('points at the offending item when several were selected', async ({ assert }) => {
    const shoeWash = await CatalogueFactory.apply('shoeWash').create()

    const [failure] = await validationMessages(() =>
      catalogueService.resolveForSelections([
        { type: ItemType.SHOE, catalogue: shoeWash.id },
        { type: ItemType.BAG, catalogue: shoeWash.id },
      ])
    )

    assert.equal(failure.field, 'items.1.catalogue')
  })
})

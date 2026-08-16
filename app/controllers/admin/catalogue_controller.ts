import CatalogueService from '#services/catalogue_service'
import CatalogueTransformer from '#transformers/catalogue_transformer'
import { catalogueValidator } from '#validators/catalogue_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class CatalogueController {
  constructor(protected catalogueService: CatalogueService) {}

  async index({ inertia, request }: HttpContext) {
    const filters = {
      search: request.input('search', '') || '',
      page: Number(request.input('page', 1)) || 1,
    }

    const catalogues = await this.catalogueService.list(filters)

    return inertia.render('admin/catalogue/index', {
      catalogues: CatalogueTransformer.paginate(catalogues.all(), catalogues.getMeta()),
      filters,
      inUseIds: await this.catalogueService.inUseIds(catalogues.all()),
    })
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('admin/catalogue/create', {
      categoryOptions: this.catalogueService.categoryOptions(),
      typeOptions: this.catalogueService.typeOptions(),
    })
  }

  async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(catalogueValidator)

    await this.catalogueService.createCatalogue(payload)

    session.flash('success', 'Layanan berhasil ditambahkan.')
    return response.redirect().toRoute('admin.catalogue.index')
  }

  async edit({ inertia, params }: HttpContext) {
    const catalogue = await this.catalogueService.findCatalogueOrFail(params.id)
    const inUse = await this.catalogueService.inUseIds([catalogue])

    return inertia.render('admin/catalogue/edit', {
      catalogue: CatalogueTransformer.transform(catalogue),
      categoryOptions: this.catalogueService.categoryOptions(),
      typeOptions: this.catalogueService.typeOptions(),
      isInUse: inUse.length > 0,
    })
  }

  async update({ params, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(catalogueValidator)

    await this.catalogueService.updateCatalogue(params.id, payload)

    session.flash('success', 'Layanan berhasil diperbarui.')
    return response.redirect().toRoute('admin.catalogue.index')
  }

  async destroy({ params, response, session }: HttpContext) {
    await this.catalogueService.deleteCatalogue(params.id)

    session.flash('success', 'Layanan berhasil dihapus.')
    return response.redirect().toRoute('admin.catalogue.index')
  }
}

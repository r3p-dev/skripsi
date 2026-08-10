import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import CatalogueService from '#services/catalogue_service'
import CatalogueTransformer from '#transformers/catalogue_transformer'

@inject()
export default class HomeController {
  constructor(protected catalogService: CatalogueService) {}

  async index({ inertia }: HttpContext) {
    const catalogues = await this.catalogService.getPublicCatalogues()

    return inertia.render('home', {
      catalogues: CatalogueTransformer.transform(catalogues),
    })
  }
}

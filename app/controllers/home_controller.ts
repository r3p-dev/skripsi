import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import CatalogueService from '#services/catalogue_service'

@inject()
export default class HomeController {
  constructor(protected catalogService: CatalogueService) {}

  async index({ inertia }: HttpContext) {
    const catalogues = await this.catalogService.getAvailableCatalogues()

    return inertia.render('home', {
      catalogues,
    })
  }
}

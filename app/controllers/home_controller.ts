import { type PageObject } from '@adonisjs/inertia/types'
import type { HttpContext } from '@adonisjs/core/http'
import Service from '#models/service'
import ServiceTransformer from '#transformers/service_transformer'

export default class HomeController {
  async show({ inertia }: HttpContext): Promise<string | PageObject<{}>> {
    const services = await Service.query().orderBy('created_at', 'asc')

    return inertia.render('home', {
      services: ServiceTransformer.transform(services),
    })
  }
}

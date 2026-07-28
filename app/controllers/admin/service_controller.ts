import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import {
  ServiceCategory,
  ServiceCategoryLabel,
  ServiceType,
  ServiceTypeLabel,
} from '#enums/service_enum'
import type Service from '#models/service'
import CatalogueService from '#services/catalogue_service'
import ExcelService, {
  DATETIME_FORMAT,
  RUPIAH_FORMAT,
  excelDate,
  excelNumber,
  sheet,
  type Column,
} from '#services/excel_service'
import ServiceTransformer from '#transformers/service_transformer'
import { serviceValidator } from '#validators/service_validator'
import type { Filters } from '#validators/shared'

const CATEGORY_OPTIONS = Object.values(ServiceCategory).map((category) => ({
  value: category,
  label: ServiceCategoryLabel[category],
}))

const TYPE_OPTIONS = Object.values(ServiceType).map((type) => ({
  value: type,
  label: ServiceTypeLabel[type],
}))

/**
 * What the spreadsheet says about a catalogue entry. This is the shop's price
 * list, which is the version of this screen anyone outside the app asks for.
 */
const SERVICE_COLUMNS: Column<Service>[] = [
  { header: 'Nama', width: 30, value: (service) => service.name },
  { header: 'Deskripsi', width: 46, value: (service) => service.description },
  {
    header: 'Kategori',
    width: 18,
    value: (service) => ServiceCategoryLabel[service.category as ServiceCategory],
  },
  { header: 'Tipe', width: 14, value: (service) => ServiceTypeLabel[service.type as ServiceType] },
  {
    header: 'Harga',
    width: 16,
    format: RUPIAH_FORMAT,
    value: (service) => excelNumber(service.price),
  },
  {
    header: 'Dibuat',
    width: 18,
    format: DATETIME_FORMAT,
    value: (service) => excelDate(service.createdAt),
  },
]

@inject()
export default class ServiceController {
  constructor(
    protected catalogueService: CatalogueService,
    protected excelService: ExcelService
  ) {}

  async index({ request, inertia }: HttpContext) {
    const filters = this.filtersFrom(request.qs())

    const services = await this.catalogueService.getAllServices(filters)

    return inertia.render('admin/service/index', {
      services: ServiceTransformer.paginate(services.all(), services.getMeta()),
      filters,
      /**
       * Which rows may still be deleted. Worked out here rather than on the
       * page so the button is already disabled instead of failing on click.
       */
      inUseIds: await this.catalogueService.getInUseServiceIds(services.all()),
    })
  }

  /**
   * The catalogue as a spreadsheet, narrowed by whatever the search box holds.
   */
  async export({ request, response }: HttpContext) {
    const services = await this.catalogueService.getAllServicesForExport(
      this.filtersFrom(request.qs())
    )

    return this.excelService.download(response, 'layanan', [
      sheet({ name: 'Layanan', columns: SERVICE_COLUMNS, rows: services }),
    ])
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('admin/service/create', {
      categoryOptions: CATEGORY_OPTIONS,
      typeOptions: TYPE_OPTIONS,
    })
  }

  async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(serviceValidator)

    const service = await this.catalogueService.createService(payload)

    session.flash('success', `Layanan ${service.name} berhasil ditambahkan.`)
    return response.redirect().toRoute('admin.service.index')
  }

  async edit({ params, inertia }: HttpContext) {
    const service = await this.catalogueService.getService(Number(params.id))

    return inertia.render('admin/service/edit', {
      service: ServiceTransformer.transform(service),
      categoryOptions: CATEGORY_OPTIONS,
      typeOptions: TYPE_OPTIONS,
      isInUse: await this.catalogueService.isInUse(service),
    })
  }

  async update({ params, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(serviceValidator)

    const service = await this.catalogueService.updateService(Number(params.id), payload)

    session.flash('success', `Layanan ${service.name} berhasil diperbarui.`)
    return response.redirect().toRoute('admin.service.index')
  }

  async destroy({ params, response, session }: HttpContext) {
    const service = await this.catalogueService.deleteService(Number(params.id))

    session.flash('success', `Layanan ${service.name} berhasil dihapus.`)
    return response.redirect().toRoute('admin.service.index')
  }

  private filtersFrom(query: Record<string, unknown>): Filters {
    return {
      page: Number(query.page) || 1,
      search: String(query.search ?? '').trim(),
    }
  }
}

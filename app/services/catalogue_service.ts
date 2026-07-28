import Service from '#models/service'
import OrderItem from '#models/order_item'
import { EXPORT_ROW_LIMIT } from '#services/excel_service'
import type { ServiceData } from '#validators/service_validator'
import type { Filters } from '#validators/shared'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { errors as vineErrors } from '@vinejs/vine'

/**
 * Manages the service catalogue an order is priced from.
 *
 * Prices here are the *current* asking price. They are copied onto an order
 * line at inspection time, so editing an entry never reprices an order that
 * has already been quoted — see `TaskService.createOrderItems`.
 */
export default class CatalogueService {
  /**
   * Lists the catalogue, newest last so the ordering matches the one the
   * booking and inspection forms use.
   */
  async getAllServices(filters: Filters): Promise<ModelPaginatorContract<Service>> {
    return this.allServicesQuery(filters).paginate(filters.page, 10)
  }

  /**
   * The whole catalogue matching the search, unpaginated, for the spreadsheet
   * export — a price list is the one thing here an admin actually wants
   * outside the app.
   */
  async getAllServicesForExport(filters: Filters): Promise<Service[]> {
    return this.allServicesQuery(filters).limit(EXPORT_ROW_LIMIT)
  }

  private allServicesQuery(filters: Filters) {
    const searchTerm = `%${filters.search}%`

    return Service.query()
      .if(filters.search, (query) => {
        query.whereILike('name', searchTerm).orWhereILike('description', searchTerm)
      })
      .orderBy('created_at', 'asc')
  }

  async getService(id: number): Promise<Service> {
    return Service.findOrFail(id)
  }

  async createService(data: ServiceData): Promise<Service> {
    return Service.create(data)
  }

  async updateService(id: number, data: ServiceData): Promise<Service> {
    const service = await this.getService(id)

    return service.merge(data).save()
  }

  /**
   * Removes a catalogue entry, refusing once it has priced an order.
   *
   * The foreign key from `order_items` restricts the delete anyway, so without
   * this check the admin would meet a database error instead of an
   * explanation. A service that is in use is history: the receipt for that
   * order still names it.
   */
  async deleteService(id: number): Promise<Service> {
    const service = await this.getService(id)

    if (await this.isInUse(service)) {
      throw new vineErrors.E_VALIDATION_ERROR([
        {
          field: 'id',
          message: 'Layanan ini sudah dipakai pada pesanan dan tidak dapat dihapus.',
        },
      ])
    }

    await service.delete()

    return service
  }

  /**
   * Whether any order line was ever priced from this service.
   */
  async isInUse(service: Service): Promise<boolean> {
    const result = await OrderItem.query().where('service_id', service.id).count('* as total')

    return Number(result[0].$extras.total) > 0
  }

  /**
   * The ids of every catalogue entry that has priced an order, so the list
   * page can disable delete on exactly those rows rather than letting an
   * admin discover the rule by being refused.
   */
  async getInUseServiceIds(services: Service[]): Promise<number[]> {
    if (services.length === 0) {
      return []
    }

    const rows = await OrderItem.query()
      .whereIn(
        'service_id',
        services.map((service) => service.id)
      )
      .distinct('service_id')
      .select('service_id')

    return rows.map((row) => row.serviceId)
  }
}

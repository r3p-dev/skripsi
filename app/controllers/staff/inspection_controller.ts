import CatalogueService from '#services/catalogue_service'
import OrderTransformer from '#transformers/order_transformer'
import CatalogueTransformer from '#transformers/catalogue_transformer'
import TaskService, { TASK_TAKEN_MESSAGE } from '#services/task_service'
import { TaskType } from '#enums/task_enum'
import { inspectionValidator } from '#validators/task_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class InspectionController {
  constructor(
    protected catalogueService: CatalogueService,
    protected taskService: TaskService
  ) {}

  async show({ auth, inertia, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const summary = await this.taskService.findSummaryByNumber(params.number)

    if (this.taskService.isBlocked(user, summary)) {
      session.flash('error', TASK_TAKEN_MESSAGE)
      return response.redirect().toRoute('staff.trip.index')
    }

    if (!this.taskService.holds(user, summary)) {
      return inertia.render('staff/inspection/show', {
        order: OrderTransformer.transform(summary).useVariant('toDetail'),
        catalogues: CatalogueTransformer.transform([]),
        claimed: false,
      })
    }

    const [order, catalogues] = await Promise.all([
      this.taskService.findByNumber(params.number),
      this.catalogueService.getPublicCatalogues(),
    ])

    return inertia.render('staff/inspection/show', {
      order: OrderTransformer.transform(order).useVariant('toDetail'),
      catalogues: CatalogueTransformer.transform(catalogues),
      claimed: true,
    })
  }

  async claim({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await this.taskService.findSummaryByNumber(params.number)

    if (!(await this.taskService.claim(user, order, TaskType.INSPECTION))) {
      session.flash('error', TASK_TAKEN_MESSAGE)
      return response.redirect().toRoute('staff.trip.index')
    }

    return response.redirect().toRoute('staff.inspection.show', { number: params.number })
  }

  async update({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const payload = await request.validateUsing(inspectionValidator)
    const order = await this.taskService.findByNumber(params.number)

    await this.taskService.completeInspection(user, order, payload)

    session.flash('success', 'Inspeksi selesai. Pelanggan diminta melunasi pembayaran.')
    return response.redirect().toRoute('staff.trip.index')
  }

  async destroy({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await this.taskService.findSummaryByNumber(params.number)

    await this.taskService.release(user, order)

    session.flash('success', 'Tugas dikembalikan ke antrean.')
    return response.redirect().toRoute('staff.trip.index')
  }
}

import OrderTransformer from '#transformers/order_transformer'
import RouteItemTransformer from '#transformers/route_item_transformer'
import TaskService from '#services/task_service'
import { TaskType, isTripType } from '#enums/task_enum'
import { taskPhotoValidator } from '#validators/task_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { errors as vineErrors } from '@vinejs/vine'

@inject()
export default class TripController {
  constructor(protected taskService: TaskService) {}

  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    const [trips, inspections, cleanings, collections] = await Promise.all([
      this.taskService.getTripQueue(user),
      this.taskService.getInspectionQueue(user),
      this.taskService.getCleaningQueue(),
      this.taskService.getCollectionQueue(),
    ])

    return inertia.render('staff/trip/index', {
      trips: RouteItemTransformer.transform(trips),
      inspections: OrderTransformer.transform(inspections).useVariant('toQueue'),
      cleanings: OrderTransformer.transform(cleanings).useVariant('toDetail'),
      collections: OrderTransformer.transform(collections).useVariant('toDetail'),
    })
  }

  async show({ auth, inertia, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const type = this.#taskType(params.type)

    const summary = await this.taskService.findSummaryByNumber(params.number)
    const claimed = await this.taskService.claim(user, summary, type)

    if (!claimed) {
      return inertia.render('staff/trip/show', {
        type,
        order: OrderTransformer.transform(summary).useVariant('toDetail'),
        route: null,
        blocked: true,
      })
    }

    const order = await this.taskService.findByNumber(params.number)

    return inertia.render('staff/trip/show', {
      type,
      order: OrderTransformer.transform(order).useVariant('toDetail'),
      route: await this.taskService.routeTo(order),
      blocked: false,
    })
  }

  async update({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const type = this.#taskType(params.type)

    const { photo } = await request.validateUsing(taskPhotoValidator)
    const order = await this.taskService.findByNumber(params.number)

    await this.taskService.completeTrip(user, order, type, photo)

    session.flash(
      'success',
      type === TaskType.PICKUP
        ? 'Penjemputan selesai. Lanjutkan ke inspeksi barang.'
        : 'Pengantaran selesai. Pesanan ditandai selesai.'
    )

    return response.redirect().toRoute('staff.trip.index')
  }

  async destroy({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await this.taskService.findByNumber(params.number)

    await this.taskService.release(user, order)

    session.flash('success', 'Tugas dikembalikan ke antrean.')
    return response.redirect().toRoute('staff.trip.index')
  }

  #taskType(value: string) {
    if (!isTripType(value)) {
      throw new vineErrors.E_VALIDATION_ERROR([
        { field: 'type', message: 'Jenis tugas tidak dikenali.' },
      ])
    }

    return value
  }
}

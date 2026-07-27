import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ActionName } from '#enums/order_action_enum'
import TaskService from '#services/task_service'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'
import ServiceTransformer from '#transformers/service_transformer'
import { inspectionValidator } from '#validators/order_validator'

@inject()
export default class InspectionController {
  constructor(
    protected service: TaskService,
    protected orderService: OrderService
  ) {}

  async show({ auth, params, inertia }: HttpContext) {
    const staff = auth.getUserOrFail()

    const { order, lock } = await this.service.claimTask(
      staff,
      String(params.number),
      ActionName.INSPECTION
    )
    const blocked = lock.staffId !== staff.id
    const services = blocked ? [] : await this.orderService.getAvailableServices()

    return inertia.render('staff/inspection/show', {
      order: OrderTransformer.transform(order),
      services: ServiceTransformer.transform(services),
      blocked,
    })
  }

  async update({ auth, params, request, response }: HttpContext) {
    const staff = auth.getUserOrFail()
    const payload = await request.validateUsing(inspectionValidator)

    await this.service.completeInspection(staff, String(params.number), payload)

    return response.redirect().toRoute('staff.trip.index')
  }

  async destroy({ auth, params, response, session }: HttpContext) {
    const staff = auth.getUserOrFail()

    await this.service.releaseTask(staff, String(params.number), ActionName.INSPECTION)

    session.flash('success', 'Tugas dibatalkan.')
    return response.redirect().toRoute('staff.trip.index')
  }
}

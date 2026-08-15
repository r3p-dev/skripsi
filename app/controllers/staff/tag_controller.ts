import OrderTransformer from '#transformers/order_transformer'
import TaskService from '#services/task_service'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class TagController {
  constructor(protected taskService: TaskService) {}

  async show({ inertia, params }: HttpContext) {
    const order = await this.taskService.findByNumber(params.number)

    return inertia.render('staff/order/tag', {
      order: OrderTransformer.transform(order).useVariant('toDetail'),
    })
  }
}

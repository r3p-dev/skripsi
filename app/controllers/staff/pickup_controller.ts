import Order, { OrderStatus } from '#models/order'
import OrderAction, { ActionName } from '#models/order_action'
import OrderTransformer from '#transformers/order_transformer'
import { cancelTaskValidator, photoValidator } from '#validators/task_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

const PICKUP_TASK = {
  attemptAction: ActionName.ATTEMPT_PICKUP,
  releaseAction: ActionName.RELEASE_PICKUP,
  completeAction: ActionName.PICKUP,
  inProgressStatus: OrderStatus.IN_PICKUP,
  nextStatus: OrderStatus.IN_INSPECTION,
  photoFolder: 'pickups',
}

export default class PickupController {
  async show({ inertia, params }: HttpContext) {
    const order = await Order.query()
      .where('number', params.number)
      .preload('address')
      .firstOrFail()

    return inertia.render('staff/pickup', {
      order: OrderTransformer.transform(order),
    })
  }

  async create({ params, auth, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    await db.transaction(async (trx) => {
      const order = await Order.query({ client: trx })
        .where('number', params.number)
        .forUpdate()
        .firstOrFail()

      if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
        session.flash('errors', 'Tugas sudah selesai atau dibatalkan.')
        return response.redirect().back()
      }

      if (order.status !== PICKUP_TASK.inProgressStatus) {
        session.flash('errors', 'Tugas pengambilan tidak dalam status aktif.')
        return response.redirect().back()
      }

      if (order.claimedBy && order.claimedBy !== user.id) {
        session.flash('errors', 'Tugas sudah diambil staff lain.')
        return response.redirect().back()
      }

      if (order.claimedBy === user.id) {
        session.flash('info', 'Tugas sudah kamu ambil sebelumnya.')
        return response.redirect().back()
      }

      await order.useTransaction(trx).merge({ claimedBy: user.id }).save()
      await OrderAction.create(
        {
          orderId: order.id,
          staffId: user.id,
          name: PICKUP_TASK.attemptAction,
          note: 'Mengambil tugas pengambilan',
        },
        { client: trx }
      )
    })

    session.flash('success', 'Berhasil ambil tugas pengambilan.')
    return response.redirect().back()
  }

  async store({ params, auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(photoValidator)

    await db.transaction(async (trx) => {
      const order = await Order.query({ client: trx })
        .where('number', params.number)
        .forUpdate()
        .firstOrFail()

      if (order.status !== PICKUP_TASK.inProgressStatus) {
        session.flash('errors', 'Tugas pengambilan tidak dalam status aktif.')
        return response.redirect().back()
      }

      if (order.claimedBy !== user.id) {
        session.flash('errors', 'Kamu tidak berhak menyelesaikan tugas ini.')
        return response.redirect().back()
      }

      const fileName = `${order.number}-${DateTime.now().toFormat('yyyyMMddHHmmss')}.${payload.image.extname}`
      const relativePath = `${PICKUP_TASK.photoFolder}/${fileName}`
      await payload.image.moveToDisk(relativePath)

      await order
        .useTransaction(trx)
        .merge({
          status: PICKUP_TASK.nextStatus,
          pickupPhotoPath: relativePath,
          pickupAt: DateTime.now(),
        })
        .save()
      await OrderAction.create(
        {
          orderId: order.id,
          staffId: user.id,
          name: PICKUP_TASK.completeAction,
          note: 'Menyelesaikan tugas pengambilan',
        },
        { client: trx }
      )
    })

    session.flash('success', 'Pengambilan berhasil diselesaikan.')
    return response.redirect().back()
  }

  async update({ params, auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(cancelTaskValidator)

    await db.transaction(async (trx) => {
      const order = await Order.query({ client: trx })
        .where('number', params.number)
        .forUpdate()
        .firstOrFail()

      if (order.status !== PICKUP_TASK.inProgressStatus) {
        session.flash('errors', 'Tugas pengambilan tidak dalam status aktif.')
        return response.redirect().back()
      }

      if (order.claimedBy !== user.id) {
        session.flash('errors', 'Kamu tidak berhak membatalkan task ini.')
        return response.redirect().back()
      }

      await order.useTransaction(trx).merge({ claimedBy: null }).save()
      await OrderAction.create(
        {
          orderId: order.id,
          staffId: user.id,
          name: PICKUP_TASK.releaseAction,
          note: `Alasan pembatalan: ${payload.reason}`,
        },
        { client: trx }
      )
    })

    session.flash('success', 'Tugas pengambilan berhasil dilepas.')
    return response.redirect().back()
  }
}

import Order, { OrderStatus } from '#models/order'
import OrderAction, { ActionName } from '#models/order_action'
import OrderItem from '#models/order_item'
import Service from '#models/service'
import Transaction, { TransactionStatus, TransactionType } from '#models/transaction'
import OrderTransformer from '#transformers/order_transformer'
import ServiceTransformer from '#transformers/service_transformer'
import { cancelTaskValidator, inspectionValidator } from '#validators/task_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

const INSPECTION_TASK = {
  attemptAction: ActionName.ATTEMPT_INSPECTION,
  releaseAction: ActionName.RELEASE_INSPECTION,
  completeAction: ActionName.INSPECTION,
  inProgressStatus: OrderStatus.IN_INSPECTION,
  nextStatus: OrderStatus.AWAITING_FULL_PAYMENT,
  photoFolder: 'inspections',
}

export default class InspectionController {
  async show({ inertia, params }: HttpContext) {
    const order = await Order.query()
      .where('number', params.number)
      .preload('address')
      .firstOrFail()
    const services = await Service.query().whereNot('type', 'additional').orderBy('price', 'desc')
    const additionals = await Service.query().where('type', 'additional').orderBy('price', 'asc')

    return inertia.render('staff/inspection', {
      order: OrderTransformer.transform(order),
      services: ServiceTransformer.transform(services),
      additionals: ServiceTransformer.transform(additionals),
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

      if (order.status !== INSPECTION_TASK.inProgressStatus) {
        session.flash('errors', 'Tugas inspeksi tidak dalam status aktif.')
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
          name: INSPECTION_TASK.attemptAction,
          note: 'Mengambil tugas inspeksi',
        },
        { client: trx }
      )
    })

    session.flash('success', 'Berhasil ambil tugas inspeksi.')
    return response.redirect().back()
  }

  async store({ params, auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(inspectionValidator)

    await db.transaction(async (trx) => {
      const order = await Order.query({ client: trx })
        .where('number', params.number)
        .forUpdate()
        .preload('shoes')
        .firstOrFail()

      if (order.status !== INSPECTION_TASK.inProgressStatus) {
        session.flash('errors', 'Tugas inspeksi tidak dalam status aktif.')
        return response.redirect().back()
      }

      if (order.claimedBy !== user.id) {
        session.flash('errors', 'Kamu tidak berhak menyelesaikan tugas ini.')
        return response.redirect().back()
      }

      const fileName = `${order.number}-${DateTime.now().toFormat('yyyyMMddHHmmss')}.${payload.image.extname}`
      const relativePath = `${INSPECTION_TASK.photoFolder}/${fileName}`
      await payload.image.moveToDisk(relativePath)

      await order
        .useTransaction(trx)
        .merge({
          status: INSPECTION_TASK.nextStatus,
          inspectionPhotoPath: relativePath,
          inspectionAt: DateTime.now(),
        })
        .save()
      await OrderAction.create(
        {
          orderId: order.id,
          staffId: user.id,
          name: INSPECTION_TASK.completeAction,
          note: 'Menyelesaikan tugas inspeksi',
        },
        { client: trx }
      )
      const transaction = await Transaction.create(
        {
          orderId: order.id,
          amount: 0,
          status: TransactionStatus.PENDING,
          type: TransactionType.FULL_PAYMENT,
        },
        { client: trx }
      )

      let totalAmount = 0
      for (const shoeData of payload.shoes) {
        const shoe = await order.related('shoes').create(
          {
            brand: shoeData.brand,
            type: shoeData.type,
            size: shoeData.size,
            material: shoeData.material,
            category: shoeData.category,
            condition: shoeData.condition,
          },
          { client: trx }
        )

        const service = await Service.query({ client: trx })
          .where('id', shoeData.service)
          .firstOrFail()
        let shoeSubtotal = service.price

        await OrderItem.create(
          {
            orderId: order.id,
            shoeId: shoe.id,
            serviceId: service.id,
            price: service.price,
            subtotal: shoeSubtotal,
          },
          { client: trx }
        )

        if (shoeData.additionalServices?.length) {
          for (const additionalId of shoeData.additionalServices) {
            const additionalService = await Service.query({ client: trx })
              .where('id', additionalId)
              .firstOrFail()
            shoeSubtotal += additionalService.price
            await OrderItem.create(
              {
                orderId: order.id,
                shoeId: shoe.id,
                serviceId: additionalService.id,
                price: additionalService.price,
                subtotal: additionalService.price,
              },
              { client: trx }
            )
          }
        }

        totalAmount += shoeSubtotal
      }

      const downPayment = await Transaction.query({ client: trx })
        .where('order_id', order.id)
        .andWhere('type', TransactionType.DOWN_PAYMENT)
        .andWhere('status', TransactionStatus.PAID)
        .firstOrFail()

      totalAmount -= downPayment.amount

      await transaction.useTransaction(trx).merge({ amount: totalAmount }).save()
    })

    session.flash('success', 'Inspeksi berhasil diselesaikan.')
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

      if (order.status !== INSPECTION_TASK.inProgressStatus) {
        session.flash('errors', 'Tugas inspeksi tidak dalam status aktif.')
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
          name: INSPECTION_TASK.releaseAction,
          note: `Alasan pembatalan: ${payload.reason}`,
        },
        { client: trx }
      )
    })

    session.flash('success', 'Tugas inspeksi berhasil dilepas.')
    return response.redirect().back()
  }
}

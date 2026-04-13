import Order, { OrderType } from '#models/order'
import OrderItem from '#models/order_item'
import Service from '#models/service'
import Transaction, { TransactionStatus, TransactionType } from '#models/transaction'
import User, { Role } from '#models/user'
import ServiceTransformer from '#transformers/service_transformer'
import UserTransformer from '#transformers/user_transformer'
import { customerValidator, offlineOrderValidator } from '#validators/order_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class OfflineOrderController {
  async create({ inertia, request }: HttpContext) {
    const payload = await request.validateUsing(customerValidator)

    const customer = await User.query()
      .whereILike('phone', `%${payload.phone}%`)
      .andWhere('role', Role.CUSTOMER)
      .first()
    const services = await Service.query().whereNot('type', 'additional').orderBy('price', 'desc')
    const additionals = await Service.query().where('type', 'additional').orderBy('price', 'asc')

    return inertia.render('staff/offline-order', {
      customer: UserTransformer.transform(customer),
      services: ServiceTransformer.transform(services),
      additionals: ServiceTransformer.transform(additionals),
    })
  }

  async store({ request, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(offlineOrderValidator)

    await db.transaction(async (trx) => {
      const customer = await User.firstOrCreate(
        {
          phone: payload.phone,
        },
        {
          name: payload.name,
          phone: payload.phone,
        },
        { client: trx }
      )

      const order = await Order.create(
        {
          type: OrderType.DROP_OFF,
          date: DateTime.now(),
          userId: customer.id,
          claimedBy: user.id,
          subtotalPrice: 0,
          discountAmount: 0,
          totalPrice: 0,
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

      await Transaction.create(
        {
          orderId: order.id,
          amount: totalAmount,
          status: TransactionStatus.PAID,
          type: TransactionType.FULL_PAYMENT,
        },
        { client: trx }
      )
    })
  }
}

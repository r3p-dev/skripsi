import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import { OrderStatus } from '#enums/order_status_enum'
import { ActionName } from '#enums/order_action_enum'
import { ItemType } from '#enums/item_type_enum'
import { TransactionStatus } from '#enums/transaction_status_enum'
import Order from '#models/order'
import User from '#models/user'
import Address from '#models/address'
import Item from '#models/item'
import Service from '#models/service'
import OrderAction from '#models/order_action'
import Transaction from '#models/transaction'
import OrderItem from '#models/order_item'

export default class OrderSeeder extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    // Get or create users (customer and staff)
    const customers = await User.query().where('role', 'customer').limit(2)
    const staffs = await User.query().where('role', 'staff').limit(2)

    // Get or create addresses
    const addresses = await Address.query().limit(2)

    // Get services
    const services = await Service.query().limit(5)

    // Create items (shoes, bags, helmets)
    const items = await Item.all()
    let createdItems = items

    if (createdItems.length === 0) {
      createdItems = await Item.createMany([
        {
          type: ItemType.SHOE,
          brand: 'Nike',
          model: 'Air Max 90',
          condition: 'moderate',
          size: '10',
          material: 'canvas',
          note: 'Slight dirt on upper',
        },
        {
          type: ItemType.SHOE,
          brand: 'Adidas',
          model: 'Stan Smith',
          condition: 'clean',
          size: '9',
          material: 'leather',
          note: null,
        },
        {
          type: ItemType.BAG,
          brand: 'Canvas Co',
          model: 'Tote Bag',
          condition: 'dirty',
          size: 'M',
          material: 'canvas',
          note: 'Heavy staining',
        },
        {
          type: ItemType.HELMET,
          brand: 'AGV',
          model: 'K-1',
          condition: 'dirty',
          size: 'L',
          material: 'plastic',
          note: 'Road dirt',
        },
        {
          type: ItemType.SHOE,
          brand: 'Jordan',
          model: '1 Retro',
          condition: 'very_dirty',
          size: '11',
          material: 'suede',
          note: 'Premium suede shoe',
        },
      ])
    }

    const customer =
      customers[0] ||
      (await User.create({
        role: 'customer',
        name: 'John Doe',
        phone: '+6281234567890',
        password: 'password',
      }))
    const staff1 =
      staffs[0] ||
      (await User.create({
        role: 'staff',
        name: 'Staff One',
        phone: '+6281234567891',
        password: 'password',
      }))
    const staff2 =
      staffs[1] ||
      (await User.create({
        role: 'staff',
        name: 'Staff Two',
        phone: '+6281234567892',
        password: 'password',
      }))
    const address =
      addresses[0] ||
      (await Address.create({
        userId: customer.id,
        recipientName: customer.name,
        recipientPhone: customer.phone,
        addressDetail: 'Jl. Merdeka No. 1, Jakarta, DKI Jakarta 12345',
        latitude: -6.2088,
        longitude: 106.8456,
        isActive: true,
        note: 'Rumah utama',
      }))

    // Generate unique order numbers
    const getOrderNumber = (prefix: string, index: number) => `${prefix}-${Date.now()}-${index}`

    // 1. PICKUP_SCHEDULED - Order waiting for pickup to be scheduled
    await Order.create({
      userId: customer.id,
      addressId: address.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      orderNumber: getOrderNumber('PKP', 1),
      status: OrderStatus.PICKUP_SCHEDULED,
      pickupDate: DateTime.now().plus({ days: 1 }),
      totalPrice: null,
    })

    // 2. IN_PICKUP - Order where pickup is currently happening
    const inPickupOrder = await Order.create({
      userId: customer.id,
      addressId: address.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      orderNumber: getOrderNumber('IPU', 2),
      status: OrderStatus.IN_PICKUP,
      pickupDate: DateTime.now(),
      totalPrice: null,
    })

    // Add order action for IN_PICKUP
    await OrderAction.create({
      orderId: inPickupOrder.id,
      staffId: staff1.id,
      name: ActionName.ATTEMPT_PICKUP,
      photoPath: null,
      note: 'Staff is on the way to pickup',
    })

    // 3. IN_INSPECTION - Order in inspection phase
    const inInspectionOrder = await Order.create({
      userId: customer.id,
      addressId: address.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      orderNumber: getOrderNumber('INS', 3),
      status: OrderStatus.IN_INSPECTION,
      pickupDate: DateTime.now(),
      totalPrice: null,
    })

    // Add pickup action and inspection action for IN_INSPECTION
    await OrderAction.createMany([
      {
        orderId: inInspectionOrder.id,
        staffId: staff1.id,
        name: ActionName.PICKUP,
        photoPath: null,
        note: 'Pickup completed',
      },
      {
        orderId: inInspectionOrder.id,
        staffId: staff1.id,
        name: ActionName.ATTEMPT_INSPECTION,
        photoPath: null,
        note: 'Inspecting items',
      },
    ])

    // 4. AWAITING_PAYMENT - Order inspected, waiting for payment
    const awaitingPaymentOrder = await Order.create({
      userId: customer.id,
      addressId: address.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      orderNumber: getOrderNumber('AWP', 4),
      status: OrderStatus.AWAITING_PAYMENT,
      pickupDate: DateTime.now(),
      totalPrice: 250000,
    })

    // Add order items
    await OrderItem.createMany([
      {
        orderId: awaitingPaymentOrder.id,
        serviceId: services[0].id,
        itemId: createdItems[0].id,
        name: `${services[0].name} - ${createdItems[0].model}`,
        price: services[0].$attributes.price,
        subtotal: services[0].$attributes.price,
      },
      {
        orderId: awaitingPaymentOrder.id,
        serviceId: services[1].id,
        itemId: createdItems[1].id,
        name: `${services[1].name} - ${createdItems[1].model}`,
        price: services[1].$attributes.price,
        subtotal: services[1].$attributes.price,
      },
    ])

    // Add order actions for AWAITING_PAYMENT
    await OrderAction.createMany([
      {
        orderId: awaitingPaymentOrder.id,
        staffId: staff1.id,
        name: ActionName.PICKUP,
        photoPath: null,
        note: 'Item picked up successfully',
      },
      {
        orderId: awaitingPaymentOrder.id,
        staffId: staff2.id,
        name: ActionName.INSPECTION,
        photoPath: null,
        note: 'Inspection completed',
      },
    ])

    // Add pending transaction
    await Transaction.create({
      orderId: awaitingPaymentOrder.id,
      midtransOrderId: `ORDER-${awaitingPaymentOrder.id}-${Date.now()}`,
      midtransTransactionId: null,
      snapToken: 'snap_token_example_pending',
      snapRedirectUrl: 'https://app.midtrans.com/snap/v1/...',
      status: TransactionStatus.PENDING,
    })

    // 5. IN_CLEANING - Order with paid transaction, in cleaning phase
    const inCleaningOrder = await Order.create({
      userId: customer.id,
      addressId: address.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      orderNumber: getOrderNumber('CLN', 5),
      status: OrderStatus.IN_CLEANING,
      pickupDate: DateTime.now(),
      totalPrice: 200000,
    })

    // Add order items for IN_CLEANING
    await OrderItem.createMany([
      {
        orderId: inCleaningOrder.id,
        serviceId: services[2].id,
        itemId: createdItems[2].id,
        name: `${services[2].name} - ${createdItems[2].model}`,
        price: services[2].$attributes.price,
        subtotal: services[2].$attributes.price,
      },
    ])

    // Add order actions
    await OrderAction.createMany([
      {
        orderId: inCleaningOrder.id,
        staffId: staff1.id,
        name: ActionName.PICKUP,
        photoPath: null,
        note: 'Items picked up',
      },
      {
        orderId: inCleaningOrder.id,
        staffId: staff2.id,
        name: ActionName.INSPECTION,
        photoPath: null,
        note: 'Inspection done',
      },
    ])

    // Add paid transaction
    await Transaction.create({
      orderId: inCleaningOrder.id,
      midtransOrderId: `ORDER-${inCleaningOrder.id}-${Date.now()}`,
      midtransTransactionId: `TXN-${inCleaningOrder.id}-${Date.now()}`,
      snapToken: null,
      snapRedirectUrl: null,
      status: TransactionStatus.PAID,
    })

    // 6. IN_DELIVERY - Order in delivery phase
    const inDeliveryOrder = await Order.create({
      userId: customer.id,
      addressId: address.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      orderNumber: getOrderNumber('DEL', 6),
      status: OrderStatus.IN_DELIVERY,
      pickupDate: DateTime.now(),
      totalPrice: 180000,
    })

    // Add order items
    await OrderItem.createMany([
      {
        orderId: inDeliveryOrder.id,
        serviceId: services[3].id,
        itemId: createdItems[3].id,
        name: `${services[3].name} - ${createdItems[3].model}`,
        price: services[3].$attributes.price,
        subtotal: services[3].$attributes.price,
      },
    ])

    // Add order actions
    await OrderAction.createMany([
      {
        orderId: inDeliveryOrder.id,
        staffId: staff1.id,
        name: ActionName.PICKUP,
        photoPath: null,
        note: 'Pickup completed',
      },
      {
        orderId: inDeliveryOrder.id,
        staffId: staff2.id,
        name: ActionName.INSPECTION,
        photoPath: null,
        note: 'Inspection completed',
      },
      {
        orderId: inDeliveryOrder.id,
        staffId: staff1.id,
        name: ActionName.ATTEMPT_DELIVERY,
        photoPath: null,
        note: 'Delivery in progress',
      },
    ])

    // Add paid transaction
    await Transaction.create({
      orderId: inDeliveryOrder.id,
      midtransOrderId: `ORDER-${inDeliveryOrder.id}-${Date.now()}`,
      midtransTransactionId: `TXN-${inDeliveryOrder.id}-${Date.now()}`,
      snapToken: null,
      snapRedirectUrl: null,
      status: TransactionStatus.PAID,
    })

    // 7. COMPLETED - Order successfully completed
    const completedOrder = await Order.create({
      userId: customer.id,
      addressId: address.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      orderNumber: getOrderNumber('COM', 7),
      status: OrderStatus.COMPLETED,
      pickupDate: DateTime.now().minus({ days: 7 }),
      totalPrice: 220000,
    })

    // Add order items
    await OrderItem.createMany([
      {
        orderId: completedOrder.id,
        serviceId: services[4].id,
        itemId: createdItems[4].id,
        name: `${services[4].name} - ${createdItems[4].model}`,
        price: services[4].$attributes.price,
        subtotal: services[4].$attributes.price,
      },
    ])

    // Add complete workflow of actions
    await OrderAction.createMany([
      {
        orderId: completedOrder.id,
        staffId: staff1.id,
        name: ActionName.PICKUP,
        photoPath: null,
        note: 'Items picked up',
      },
      {
        orderId: completedOrder.id,
        staffId: staff2.id,
        name: ActionName.INSPECTION,
        photoPath: null,
        note: 'Inspection done - ready to clean',
      },
      {
        orderId: completedOrder.id,
        staffId: staff1.id,
        name: ActionName.DELIVERY,
        photoPath: null,
        note: 'Items delivered successfully',
      },
    ])

    // Add paid transaction
    await Transaction.create({
      orderId: completedOrder.id,
      midtransOrderId: `ORDER-${completedOrder.id}-${Date.now()}`,
      midtransTransactionId: `TXN-${completedOrder.id}-${Date.now()}`,
      snapToken: null,
      snapRedirectUrl: null,
      status: TransactionStatus.PAID,
    })

    // 8. CANCELLED - Order cancelled by customer
    const cancelledOrder = await Order.create({
      userId: customer.id,
      addressId: address.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      orderNumber: getOrderNumber('CAN', 8),
      status: OrderStatus.CANCELLED,
      pickupDate: DateTime.now(),
      totalPrice: null,
    })

    // Add action for cancellation
    await OrderAction.create({
      orderId: cancelledOrder.id,
      staffId: staff1.id,
      name: ActionName.RELEASE_PICKUP,
      photoPath: null,
      note: 'Order cancelled by customer',
    })

    // Add expired transaction for cancelled order
    await Transaction.create({
      orderId: cancelledOrder.id,
      midtransOrderId: `ORDER-${cancelledOrder.id}-${Date.now()}`,
      midtransTransactionId: null,
      snapToken: null,
      snapRedirectUrl: null,
      status: TransactionStatus.CANCELLED,
    })

    // 9. OFFLINE_ORDER - Order created offline
    const offlineOrder = await Order.create({
      userId: null, // No user for offline order
      addressId: address.id,
      customerName: 'Walk-in Customer',
      customerPhone: '+62812345678910',
      orderNumber: getOrderNumber('OFF', 9),
      status: OrderStatus.COMPLETED,
      pickupDate: DateTime.now(),
      totalPrice: 150000,
    })

    // Add order items
    await OrderItem.create({
      orderId: offlineOrder.id,
      serviceId: services[0].id,
      itemId: createdItems[0].id,
      name: `${services[0].name} - Offline Order`,
      price: services[0].$attributes.price,
      subtotal: services[0].$attributes.price,
    })

    // Add offline order action
    await OrderAction.createMany([
      {
        orderId: offlineOrder.id,
        staffId: staff1.id,
        name: ActionName.OFFLINE_ORDER,
        photoPath: null,
        note: 'Offline order created',
      },
      {
        orderId: offlineOrder.id,
        staffId: staff1.id,
        name: ActionName.DELIVERY,
        photoPath: null,
        note: 'Items handed to customer',
      },
    ])

    // Add paid transaction
    await Transaction.create({
      orderId: offlineOrder.id,
      midtransOrderId: null,
      midtransTransactionId: null,
      snapToken: null,
      snapRedirectUrl: null,
      status: TransactionStatus.PAID,
    })

    console.log('✅ Order seeding completed with all statuses and scenarios!')
  }
}

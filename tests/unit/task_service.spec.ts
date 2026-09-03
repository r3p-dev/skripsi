import { test } from '@japa/runner'
import AddressService from '#services/address_service'
import CatalogueService from '#services/catalogue_service'
import OrderService from '#services/order_service'
import RoutingService from '#services/routing_service'
import TaskService from '#services/task_service'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import testUtils from '@adonisjs/core/services/test_utils'
import { ActionName } from '#enums/order_action_enum'
import { OrderStatus, OrderType } from '#enums/order_enum'
import { CLAIM_DURATION_HOURS, TaskType } from '#enums/task_enum'
import { UserFactory } from '#database/factories/user_factory'
import { stubOrderActionFailure } from '#tests/utils/fakes'
import { createCustomer, createOrder } from '#tests/utils/helpers'
import drive from '@adonisjs/drive/services/main'
import { DateTime } from 'luxon'

const taskService = new TaskService(
  new AddressService(),
  new CatalogueService(),
  new OrderService(new AddressService()),
  new RoutingService()
)

function staff() {
  return UserFactory.apply('staff').create()
}

test.group('TaskService | claiming a task', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('an unclaimed task can be taken', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const petugas = await staff()

    assert.isTrue(await taskService.claim(petugas, order, TaskType.PICKUP))

    await order.refresh()
    assert.equal(order.claimedBy, petugas.id)
    assert.equal(order.claimedTask, TaskType.PICKUP)
  })

  test('a task already held by someone else cannot be taken', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const [first, second] = [await staff(), await staff()]

    assert.isTrue(await taskService.claim(first, order, TaskType.PICKUP))
    assert.isFalse(await taskService.claim(second, order, TaskType.PICKUP))

    await order.refresh()
    assert.equal(order.claimedBy, first.id)
  })

  test('the holder may reopen their own task', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const petugas = await staff()

    assert.isTrue(await taskService.claim(petugas, order, TaskType.PICKUP))
    assert.isTrue(await taskService.claim(petugas, order, TaskType.PICKUP))
  })

  test('a claim left to go stale returns to the queue', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const [absentee, petugas] = [await staff(), await staff()]

    await taskService.claim(absentee, order, TaskType.PICKUP)

    await Order.query()
      .where('id', order.id)
      .update({
        claimed_at: DateTime.now().minus({ hours: CLAIM_DURATION_HOURS, minutes: 1 }).toJSDate(),
      })

    await order.refresh()

    assert.isTrue(await taskService.claim(petugas, order, TaskType.PICKUP))
    await order.refresh()
    assert.equal(order.claimedBy, petugas.id)
  })

  test('a task cannot be claimed for the wrong stage of the order', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const petugas = await staff()

    assert.isFalse(await taskService.claim(petugas, order, TaskType.DELIVERY))
    assert.isFalse(await taskService.claim(petugas, order, TaskType.INSPECTION))
  })

  test('cleaning and collection need no reservation', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { states: ['inCleaning'] })
    const petugas = await staff()

    assert.isTrue(await taskService.claim(petugas, order, TaskType.CLEANING))

    await order.refresh()
    assert.isNull(order.claimedBy)
  })
})

test.group('TaskService | releasing a task', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the holder can hand a task back', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const petugas = await staff()

    await taskService.claim(petugas, order, TaskType.PICKUP)
    await taskService.release(petugas, order)

    await order.refresh()
    assert.isNull(order.claimedBy)
    assert.isNull(order.claimedTask)
    assert.isNull(order.claimedAt)
  })

  test('somebody else cannot drop a task they do not hold', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const [holder, other] = [await staff(), await staff()]

    await taskService.claim(holder, order, TaskType.PICKUP)
    await taskService.release(other, order)

    await order.refresh()
    assert.equal(order.claimedBy, holder.id)
  })
})

test.group('TaskService | who is blocked', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('an unclaimed order blocks nobody', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)

    assert.isFalse(taskService.isBlocked(await staff(), order))
  })

  test('the holder is not blocked by their own claim', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const petugas = await staff()

    await taskService.claim(petugas, order, TaskType.PICKUP)
    await order.refresh()

    assert.isFalse(taskService.isBlocked(petugas, order))
  })

  test('everyone else is blocked while the claim is live', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const [holder, other] = [await staff(), await staff()]

    await taskService.claim(holder, order, TaskType.PICKUP)
    await order.refresh()

    assert.isTrue(taskService.isBlocked(other, order))
  })

  test('nobody is blocked once the claim has lapsed', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const [holder, other] = [await staff(), await staff()]

    await taskService.claim(holder, order, TaskType.PICKUP)
    await order.refresh()

    order.claimedAt = DateTime.now().minus({ hours: CLAIM_DURATION_HOURS, minutes: 1 })

    assert.isFalse(taskService.isBlocked(other, order))
  })
})

test.group('TaskService | the queues', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the trip queue carries both pickups and deliveries', async ({ assert }) => {
    const customer = await createCustomer()
    const petugas = await staff()

    const pickup = await createOrder(customer)
    const delivery = await createOrder(customer, {
      attributes: { status: OrderStatus.IN_DELIVERY },
    })

    const trips = await taskService.getTripQueue(petugas)
    const byNumber = new Map(trips.map((trip) => [trip.orderNumber, trip.type]))

    assert.equal(byNumber.get(pickup.orderNumber), TaskType.PICKUP)
    assert.equal(byNumber.get(delivery.orderNumber), TaskType.DELIVERY)
  })

  test('a trip claimed by someone else drops out of the queue', async ({ assert }) => {
    const customer = await createCustomer()
    const [holder, other] = [await staff(), await staff()]

    const order = await createOrder(customer)
    await taskService.claim(holder, order, TaskType.PICKUP)

    const trips = await taskService.getTripQueue(other)

    assert.notInclude(
      trips.map((trip) => trip.orderNumber),
      order.orderNumber
    )
  })

  test('a trip you hold yourself stays in your own queue', async ({ assert }) => {
    const customer = await createCustomer()
    const petugas = await staff()

    const order = await createOrder(customer)
    await taskService.claim(petugas, order, TaskType.PICKUP)

    const trips = await taskService.getTripQueue(petugas)

    assert.include(
      trips.map((trip) => trip.orderNumber),
      order.orderNumber
    )
  })

  test('walk-ins with no address never reach the trip queue', async ({ assert }) => {
    const customer = await createCustomer()
    const petugas = await staff()

    const walkIn = await createOrder(
      { user: customer.user, address: null },
      { states: ['walkIn'], attributes: { status: OrderStatus.PICKUP_SCHEDULED } }
    )

    const trips = await taskService.getTripQueue(petugas)

    assert.notInclude(
      trips.map((trip) => trip.orderNumber),
      walkIn.orderNumber
    )
  })

  test('each queue only shows orders at its own stage', async ({ assert }) => {
    const customer = await createCustomer()
    const petugas = await staff()

    const inspecting = await createOrder(customer, { states: ['collected'] })
    const cleaning = await createOrder(customer, { states: ['inCleaning'] })
    const collecting = await createOrder(customer, {
      attributes: { status: OrderStatus.CLEANING_DONE },
    })

    const [inspections, cleanings, collections] = await Promise.all([
      taskService.getInspectionQueue(petugas),
      taskService.getCleaningQueue(),
      taskService.getCollectionQueue(),
    ])

    const ids = (orders: Order[]) => orders.map((order) => order.id)

    assert.include(ids(inspections), inspecting.id)
    assert.notInclude(ids(cleanings), inspecting.id)
    assert.notInclude(ids(collections), inspecting.id)

    assert.include(ids(cleanings), cleaning.id)
    assert.notInclude(ids(inspections), cleaning.id)
    assert.notInclude(ids(collections), cleaning.id)

    assert.include(ids(collections), collecting.id)
    assert.notInclude(ids(inspections), collecting.id)
    assert.notInclude(ids(cleanings), collecting.id)
  })

  test('the trip queue is ordered nearest first', async ({ assert }) => {
    const petugas = await staff()

    const near = await createCustomer()
    const far = await createCustomer()

    await near.address.merge({ latitude: '-6.9175', longitude: '107.6191' }).save()
    await far.address.merge({ latitude: '-6.9175', longitude: '107.9191' }).save()

    const farOrder = await createOrder(far)
    const nearOrder = await createOrder(near)

    const trips = await taskService.getTripQueue(petugas)
    const positions = trips.map((trip) => trip.orderNumber)

    assert.isBelow(
      positions.indexOf(nearOrder.orderNumber),
      positions.indexOf(farOrder.orderNumber)
    )
  })
})

test.group('TaskService | finishing a trip', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a finished pickup moves the order on and frees the claim', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const petugas = await staff()

    await taskService.claim(petugas, order, TaskType.PICKUP)
    await order.refresh()

    await taskService.completeTrip(petugas, order, TaskType.PICKUP, fakePhoto())
    await order.refresh()

    assert.equal(order.status, OrderStatus.IN_PICKUP)
    assert.isNull(order.claimedBy)
  })

  test('a finished delivery completes the order', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.IN_DELIVERY },
    })
    const petugas = await staff()

    await taskService.claim(petugas, order, TaskType.DELIVERY)
    await order.refresh()

    await taskService.completeTrip(petugas, order, TaskType.DELIVERY, fakePhoto())
    await order.refresh()

    assert.equal(order.status, OrderStatus.COMPLETED)
  })

  test('finishing a trip is written into the order history', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const petugas = await staff()

    await taskService.claim(petugas, order, TaskType.PICKUP)
    await order.refresh()
    await taskService.completeTrip(petugas, order, TaskType.PICKUP, fakePhoto())

    const actions = await OrderAction.query().where('order_id', order.id)

    assert.lengthOf(actions, 1)
    assert.equal(actions[0].name, ActionName.PICKUP)
    assert.equal(actions[0].userId, petugas.id)
    assert.isNotNull(actions[0].photoPath)
  })

  test('a staff member cannot finish a trip somebody else is running', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer)
    const [holder, other] = [await staff(), await staff()]

    await taskService.claim(holder, order, TaskType.PICKUP)
    await order.refresh()

    await assert.rejects(() => taskService.completeTrip(other, order, TaskType.PICKUP, fakePhoto()))
  })
})

test.group('TaskService | finishing the wash', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('washed goods with an address go out for delivery', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      states: ['inCleaning'],
      attributes: { type: OrderType.ONLINE },
    })

    await taskService.completeCleaning(await staff(), order, fakePhoto())
    await order.refresh()

    assert.equal(order.status, OrderStatus.IN_DELIVERY)
    assert.isTrue(taskService.awaitsDelivery(order))
  })

  test('washed goods with nowhere to go wait to be collected', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(
      { user: customer.user, address: null },
      { states: ['walkIn', 'inCleaning'] }
    )

    await taskService.completeCleaning(await staff(), order, fakePhoto())
    await order.refresh()

    assert.equal(order.status, OrderStatus.CLEANING_DONE)
    assert.isFalse(taskService.awaitsDelivery(order))
  })

  test('an order that is not being washed cannot be finished', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, { attributes: { status: OrderStatus.COMPLETED } })
    const petugas = await staff()

    await assert.rejects(() => taskService.completeCleaning(petugas, order, fakePhoto()))
  })
})

test.group('TaskService | handing goods over', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a collected order is closed out', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.CLEANING_DONE },
    })

    await taskService.completeCollection(await staff(), order, fakePhoto())
    await order.refresh()

    assert.equal(order.status, OrderStatus.COMPLETED)
  })

  test('the handover is written into the order history with its photo', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.CLEANING_DONE },
    })
    const petugas = await staff()

    await taskService.completeCollection(petugas, order, fakePhoto())

    const actions = await OrderAction.query().where('order_id', order.id)

    assert.lengthOf(actions, 1)
    assert.equal(actions[0].name, ActionName.COLLECTED)
    assert.equal(actions[0].userId, petugas.id)
    assert.isNotNull(actions[0].photoPath)
  })
})

test.group('TaskService | the proof photos', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a photo is swept up when the transition it belongs to fails', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.CLEANING_DONE },
    })
    const petugas = await staff()

    const written: string[] = []
    const restore = stubOrderActionFailure()

    try {
      await assert.rejects(() =>
        taskService.completeCollection(petugas, order, writingPhoto(written))
      )
    } finally {
      restore()
    }

    assert.lengthOf(written, 1, 'the photo did reach the disk before the failure')
    assert.isFalse(await drive.use().exists(written[0]), 'and was removed again')
  })

  test('a photo of a transition that went through is kept', async ({ assert }) => {
    const customer = await createCustomer()
    const order = await createOrder(customer, {
      attributes: { status: OrderStatus.CLEANING_DONE },
    })

    const written: string[] = []

    await taskService.completeCollection(await staff(), order, writingPhoto(written))

    assert.isTrue(await drive.use().exists(written[0]))

    await drive.use().delete(written[0])
  })
})

function fakePhoto() {
  return {
    extname: 'jpg',
    async moveToDisk() {},
  } as never
}

function writingPhoto(written: string[]) {
  return {
    extname: 'jpg',
    async moveToDisk(key: string) {
      written.push(key)

      await drive.use().put(key, 'proof')
    },
  } as never
}

import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import RouteService from '#services/route_service'
import TaskService from '#services/task_service'
import { ActionName } from '#enums/order_action_enum'

function makeAction(name: string, staffId: number, createdAt: DateTime): OrderAction {
  const action = new OrderAction()
  action.name = name
  action.staffId = staffId
  action.createdAt = createdAt
  return action
}

function makeOrder(actions: OrderAction[]): Order {
  const order = new Order()
  order.actions = actions as unknown as Order['actions']
  return order
}

test.group('TaskService.resolveTaskLock', () => {
  const service = new TaskService(new RouteService())
  const now = DateTime.now()

  test('returns null when there are no actions at all', ({ assert }) => {
    const order = makeOrder([])

    const lock = service.resolveTaskLock(order, ActionName.PICKUP)

    assert.isNull(lock)
  })

  test('locks to the staff whose attempt is the most recent action', ({ assert }) => {
    const order = makeOrder([makeAction(ActionName.ATTEMPT_PICKUP, 1, now)])

    const lock = service.resolveTaskLock(order, ActionName.PICKUP)

    assert.deepEqual(lock, { staffId: 1 })
  })

  test('unlocks once the attempt is followed by a release', ({ assert }) => {
    const order = makeOrder([
      makeAction(ActionName.ATTEMPT_PICKUP, 1, now.minus({ minutes: 1 })),
      makeAction(ActionName.RELEASE_PICKUP, 1, now),
    ])

    const lock = service.resolveTaskLock(order, ActionName.PICKUP)

    assert.isNull(lock)
  })

  test('unlocks once the task has been completed', ({ assert }) => {
    const order = makeOrder([
      makeAction(ActionName.ATTEMPT_PICKUP, 1, now.minus({ minutes: 1 })),
      makeAction(ActionName.PICKUP, 1, now),
    ])

    const lock = service.resolveTaskLock(order, ActionName.PICKUP)

    assert.isNull(lock)
  })

  test('re-locks to whoever attempts again after a release', ({ assert }) => {
    const order = makeOrder([
      makeAction(ActionName.ATTEMPT_PICKUP, 1, now.minus({ minutes: 2 })),
      makeAction(ActionName.RELEASE_PICKUP, 1, now.minus({ minutes: 1 })),
      makeAction(ActionName.ATTEMPT_PICKUP, 2, now),
    ])

    const lock = service.resolveTaskLock(order, ActionName.PICKUP)

    assert.deepEqual(lock, { staffId: 2 })
  })

  test('ignores actions that belong to a different task type', ({ assert }) => {
    const order = makeOrder([makeAction(ActionName.ATTEMPT_DELIVERY, 1, now)])

    const lock = service.resolveTaskLock(order, ActionName.PICKUP)

    assert.isNull(lock)
  })

  test('does not depend on the actions being stored in order', ({ assert }) => {
    const order = makeOrder([
      makeAction(ActionName.RELEASE_PICKUP, 1, now.minus({ minutes: 1 })),
      makeAction(ActionName.ATTEMPT_PICKUP, 1, now.minus({ minutes: 2 })),
      makeAction(ActionName.ATTEMPT_PICKUP, 2, now),
    ])

    const lock = service.resolveTaskLock(order, ActionName.PICKUP)

    assert.deepEqual(lock, { staffId: 2 })
  })
})

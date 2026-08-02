import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Order from '#models/order'
import BroadcastService from '#services/broadcast_service'
import RouteService from '#services/route_service'
import TaskService from '#services/task_service'
import { ActionName } from '#enums/order_action_enum'

/**
 * An order carrying a lock, without touching the database.
 *
 * The lock used to be derived by replaying the order's action log, so these
 * tests built one out of actions. It is three columns on the order now, which
 * is both what the queue queries filter on and what this reads.
 */
function lockedOrder(
  task: string | null,
  staffId: number | null,
  until: DateTime | null = DateTime.now().plus({ hours: 1 })
): Order {
  const order = new Order()

  order.lockedTask = task
  order.lockedById = staffId
  order.lockedUntil = until

  return order
}

test.group('TaskService.resolveTaskLock', () => {
  const service = new TaskService(new RouteService(), new BroadcastService())

  test('returns null when nobody holds the order', ({ assert }) => {
    const lock = service.resolveTaskLock(lockedOrder(null, null, null), ActionName.PICKUP)

    assert.isNull(lock)
  })

  test('locks to the staff member named on the order', ({ assert }) => {
    const lock = service.resolveTaskLock(lockedOrder(ActionName.PICKUP, 1), ActionName.PICKUP)

    assert.deepEqual(lock, { staffId: 1 })
  })

  test('ignores a lock held for a different task type', ({ assert }) => {
    const lock = service.resolveTaskLock(lockedOrder(ActionName.DELIVERY, 1), ActionName.PICKUP)

    assert.isNull(lock)
  })

  /**
   * The reason claims expire at all: a staff member who claims a stop and then
   * loses signal, goes home, or simply forgets would otherwise keep that order
   * out of everyone else's queue until an admin edited a row by hand.
   */
  test('treats a lapsed claim as no lock at all', ({ assert }) => {
    const lapsed = lockedOrder(ActionName.PICKUP, 1, DateTime.now().minus({ minutes: 1 }))

    const lock = service.resolveTaskLock(lapsed, ActionName.PICKUP)

    assert.isNull(lock)
  })

  test('still holds a claim that has not run out yet', ({ assert }) => {
    const held = lockedOrder(ActionName.PICKUP, 7, DateTime.now().plus({ minutes: 1 }))

    const lock = service.resolveTaskLock(held, ActionName.PICKUP)

    assert.deepEqual(lock, { staffId: 7 })
  })

  test('returns null when a task is named but nobody is on it', ({ assert }) => {
    const lock = service.resolveTaskLock(lockedOrder(ActionName.PICKUP, null), ActionName.PICKUP)

    assert.isNull(lock)
  })
})

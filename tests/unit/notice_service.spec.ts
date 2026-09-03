import { test } from '@japa/runner'
import NoticeService, { type DailyNoticeReport } from '#services/notice_service'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import SendDailyNotices from '../../commands/send_daily_notices.js'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { ActionName } from '#enums/order_action_enum'
import { OrderStatus } from '#enums/order_enum'
import { BrokenWhatsappService, FakeWhatsappService } from '#tests/utils/fakes'
import { createCustomer, createOrder } from '#tests/utils/helpers'

function build(whatsapp = new FakeWhatsappService()) {
  return { notices: new NoticeService(whatsapp), whatsapp }
}

/**
 * The test database is shared with everyday work, so it already holds orders
 * waiting to be collected or paid for. Telling that backlog first — inside the
 * transaction the test rolls back — leaves each test looking only at the
 * orders it created itself.
 */
async function drainBacklog(): Promise<void> {
  await new NoticeService(new FakeWhatsappService()).sendDailyNotices()
}

function freshBacklog(group: Parameters<Parameters<typeof test.group>[1]>[0]): void {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => drainBacklog())
}

async function readyOrder(attributes: Record<string, unknown> = {}): Promise<Order> {
  return createOrder(await createCustomer(), {
    attributes: { status: OrderStatus.CLEANING_DONE, ...attributes },
  })
}

async function billedOrder(attributes: Record<string, unknown> = {}): Promise<Order> {
  return createOrder(await createCustomer(), {
    attributes: { status: OrderStatus.AWAITING_PAYMENT, totalPrice: '120000', ...attributes },
  })
}

async function markNotified(order: Order, name: ActionName): Promise<void> {
  await OrderAction.create({
    orderId: order.id,
    userId: null,
    name,
    photoPath: null,
    note: null,
  })
}

async function noticesFor(order: Order, name: ActionName): Promise<OrderAction[]> {
  return OrderAction.query().where('order_id', order.id).where('name', name)
}

test.group('Daily notices | orders ready for collection', (group) => {
  freshBacklog(group)

  test('an order waiting to be picked up is told about', async ({ assert }) => {
    const { notices, whatsapp } = build()
    const order = await readyOrder()

    const result = await notices.sendReadyForCollectionNotices()

    assert.equal(result.sent, 1)
    assert.equal(whatsapp.messageTo(order.customerPhone)?.body, order.orderNumber)
    assert.lengthOf(await noticesFor(order, ActionName.READY_NOTICE_SENT), 1)
  })

  test('an order told about yesterday is not told about again', async ({ assert }) => {
    const { notices, whatsapp } = build()
    const order = await readyOrder()

    await markNotified(order, ActionName.READY_NOTICE_SENT)

    const result = await notices.sendReadyForCollectionNotices()

    assert.equal(result.sent, 0)
    assert.equal(result.skipped, 0, 'it never even reaches the sending step')
    assert.isEmpty(whatsapp.messages)
    assert.lengthOf(await noticesFor(order, ActionName.READY_NOTICE_SENT), 1)
  })

  test('running the job twice in a day messages nobody twice', async ({ assert }) => {
    const { notices, whatsapp } = build()
    const order = await readyOrder()

    await notices.sendReadyForCollectionNotices()
    await notices.sendReadyForCollectionNotices()

    assert.lengthOf(whatsapp.messages, 1)
    assert.lengthOf(await noticesFor(order, ActionName.READY_NOTICE_SENT), 1)
  })

  test('an order already collected is left alone', async ({ assert }) => {
    const { notices, whatsapp } = build()

    await readyOrder({ status: OrderStatus.COMPLETED })

    const result = await notices.sendReadyForCollectionNotices()

    assert.equal(result.sent, 0)
    assert.isEmpty(whatsapp.messages)
  })

  test('a cancelled order is left alone', async ({ assert }) => {
    const { notices, whatsapp } = build()

    await readyOrder({ status: OrderStatus.CANCELLED })

    const result = await notices.sendReadyForCollectionNotices()

    assert.equal(result.sent, 0)
    assert.isEmpty(whatsapp.messages)
  })

  test('an order still being washed is left alone', async ({ assert }) => {
    const { notices, whatsapp } = build()

    await readyOrder({ status: OrderStatus.IN_CLEANING })

    const result = await notices.sendReadyForCollectionNotices()

    assert.equal(result.sent, 0)
    assert.isEmpty(whatsapp.messages)
  })

  test('an order collected between the query and the send is skipped', async ({ assert }) => {
    const { notices, whatsapp } = build()
    const order = await readyOrder()

    const collected = await readyOrder()
    await Order.query().where('id', collected.id).update({ status: OrderStatus.COMPLETED })

    const result = await notices.sendReadyForCollectionNotices()

    assert.equal(result.sent, 1)
    assert.isDefined(whatsapp.messageTo(order.customerPhone))
    assert.isUndefined(whatsapp.messageTo(collected.customerPhone))
    assert.isEmpty(await noticesFor(collected, ActionName.READY_NOTICE_SENT))
  })

  test('every waiting order is told, one notice each', async ({ assert }) => {
    const { notices, whatsapp } = build()

    const waiting = [await readyOrder(), await readyOrder(), await readyOrder()]

    const result = await notices.sendReadyForCollectionNotices()

    assert.equal(result.sent, 3)
    assert.lengthOf(whatsapp.messages, 3)

    for (const order of waiting) {
      assert.lengthOf(await noticesFor(order, ActionName.READY_NOTICE_SENT), 1)
    }
  })

  test('a message that will not send leaves the order due for tomorrow', async ({ assert }) => {
    const notices = new NoticeService(new BrokenWhatsappService())
    const order = await readyOrder()

    const result = await notices.sendReadyForCollectionNotices()

    assert.equal(result.failed, 1)
    assert.equal(result.sent, 0)
    assert.isEmpty(await noticesFor(order, ActionName.READY_NOTICE_SENT))
  })

  test('one broken number does not stop the rest of the round', async ({ assert }) => {
    const whatsapp = new FakeWhatsappService()
    const { notices } = build(whatsapp)

    const refused = await readyOrder()
    const reachable = await readyOrder()

    whatsapp.refuse(refused.customerPhone)

    const result = await notices.sendReadyForCollectionNotices()

    assert.equal(result.sent, 1)
    assert.equal(result.failed, 1)
    assert.isDefined(whatsapp.messageTo(reachable.customerPhone))
    assert.isEmpty(await noticesFor(refused, ActionName.READY_NOTICE_SENT))
  })
})

test.group('Daily notices | bills still awaiting payment', (group) => {
  freshBacklog(group)

  test('an unpaid bill gets a reminder carrying the amount', async ({ assert }) => {
    const { notices, whatsapp } = build()
    const order = await billedOrder()

    const result = await notices.sendPaymentReminders()

    assert.equal(result.sent, 1)
    assert.include(whatsapp.messageTo(order.customerPhone)?.body, order.orderNumber)
    assert.include(whatsapp.messageTo(order.customerPhone)?.body, '120.000')
    assert.lengthOf(await noticesFor(order, ActionName.PAYMENT_REMINDER_SENT), 1)
  })

  test('a bill already reminded about is left alone', async ({ assert }) => {
    const { notices, whatsapp } = build()
    const order = await billedOrder()

    await markNotified(order, ActionName.PAYMENT_REMINDER_SENT)
    await notices.sendPaymentReminders()

    assert.isEmpty(whatsapp.messages)
  })

  test('an order the staff have not priced yet is left alone', async ({ assert }) => {
    const { notices, whatsapp } = build()

    await billedOrder({ totalPrice: null })

    const result = await notices.sendPaymentReminders()

    assert.equal(result.sent, 0)
    assert.isEmpty(whatsapp.messages)
  })

  test('an order already paid for is left alone', async ({ assert }) => {
    const { notices, whatsapp } = build()

    await billedOrder({ status: OrderStatus.IN_CLEANING })

    const result = await notices.sendPaymentReminders()

    assert.equal(result.sent, 0)
    assert.isEmpty(whatsapp.messages)
  })
})

test.group('Daily notices | the daily round', (group) => {
  freshBacklog(group)

  test('one run covers both notices and reports what it did', async ({ assert }) => {
    const { notices, whatsapp } = build()

    const ready = await readyOrder()
    const unpaid = await billedOrder()

    const report = await notices.sendDailyNotices()

    assert.equal(report.readyForCollection.sent, 1)
    assert.equal(report.paymentReminder.sent, 1)
    assert.isDefined(whatsapp.messageTo(ready.customerPhone))
    assert.isDefined(whatsapp.messageTo(unpaid.customerPhone))
  })

  test('a second run the same day sends nothing', async ({ assert }) => {
    const { notices, whatsapp } = build()

    await readyOrder()
    await billedOrder()

    await notices.sendDailyNotices()

    const second = await notices.sendDailyNotices()

    assert.equal(second.readyForCollection.sent, 0)
    assert.equal(second.paymentReminder.sent, 0)
    assert.lengthOf(whatsapp.messages, 2)
  })
})

/**
 * The command is a thin wrapper, so these swap the whole service out: nothing
 * a test does here can put a message on a real phone.
 */
class StubNoticeService extends NoticeService {
  runs = 0

  constructor(private canned: DailyNoticeReport) {
    super(new FakeWhatsappService())
  }

  async sendDailyNotices(): Promise<DailyNoticeReport> {
    this.runs += 1

    return this.canned
  }
}

function noticeReport(sent: number, failed = 0): DailyNoticeReport {
  const result = { sent, skipped: 0, failed }

  return { readyForCollection: result, paymentReminder: result }
}

async function runCommand(): Promise<SendDailyNotices> {
  const ace = await app.container.make('ace')

  ace.ui.switchMode('raw')

  const command = await ace.create(SendDailyNotices, [])

  await command.exec()

  return command
}

test.group('Daily notices | the ace command', () => {
  test('the daily run goes through the notice service', async ({ assert }) => {
    const stub = new StubNoticeService(noticeReport(2))

    app.container.swap(NoticeService, () => stub)

    try {
      const command = await runCommand()

      assert.equal(stub.runs, 1)
      assert.equal(command.exitCode, 0)
      assert.isTrue(
        command.logger.getLogs().some((log) => log.message.includes('ready for collection: 2 sent'))
      )
    } finally {
      app.container.restore(NoticeService)
    }
  })

  test('a round with failures in it comes back unhappy', async ({ assert }) => {
    app.container.swap(NoticeService, () => new StubNoticeService(noticeReport(1, 1)))

    try {
      const command = await runCommand()

      assert.equal(command.exitCode, 1)
    } finally {
      app.container.restore(NoticeService)
    }
  })
})

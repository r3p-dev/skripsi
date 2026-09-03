import emitter from '@adonisjs/core/services/emitter'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

type EventClass = new (...args: never[]) => unknown

export async function dispatch<Event extends EventClass>(
  event: Event,
  data: InstanceType<Event>,
  trx?: TransactionClientContract
): Promise<void> {
  if (trx) {
    trx.after('commit', () => emitter.emit(event, data))

    return
  }

  await emitter.emit(event, data)
}

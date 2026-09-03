import NoticeService, { type NoticeResult } from '#services/notice_service'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Run once a day from the host's scheduler, e.g.
 *
 *   0 9 * * *  cd /srv/umimaclean && node ace send:daily-notices
 *
 * Running it more often is harmless: every notice is recorded against the
 * order, and an order already told is never told again.
 */
export default class SendDailyNotices extends BaseCommand {
  static commandName = 'send:daily-notices'
  static description =
    'Send the daily WhatsApp notices: orders ready for collection, and bills still awaiting payment'

  static options: CommandOptions = { startApp: true }

  async run() {
    const notices = await this.app.container.make(NoticeService)
    const report = await notices.sendDailyNotices()

    this.#report('ready for collection', report.readyForCollection)
    this.#report('payment reminder', report.paymentReminder)

    if (report.readyForCollection.failed + report.paymentReminder.failed > 0) {
      this.exitCode = 1
    }
  }

  #report(notice: string, result: NoticeResult): void {
    const summary = `${notice}: ${result.sent} sent, ${result.skipped} skipped, ${result.failed} failed`

    if (result.failed > 0) {
      this.logger.error(summary)

      return
    }

    this.logger.info(summary)
  }
}

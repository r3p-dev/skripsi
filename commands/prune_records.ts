import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { DateTime } from 'luxon'
import drive from '@adonisjs/drive/services/main'
import OrderAction from '#models/order_action'
import AddressService from '#services/address_service'

/**
 * How long a proof photo is kept.
 *
 * Ninety days is how long a dispute about a collection or a hand-over stays
 * live in practice, and it is what the signed URLs handed out with those
 * photos are already set to expire after — so past this point the file is not
 * evidence of anything, it is a picture of a stranger's front door taking up
 * disk. The audit trail itself is never touched: the action, who did it and
 * when it happened stay exactly where they are, only the image goes.
 */
const PHOTO_RETENTION_DAYS = 90

/**
 * Regular housekeeping.
 *
 * Meant to be run on a schedule — nightly is plenty — by cron, a systemd
 * timer, or whatever the host already uses. Both jobs are safe to run again
 * on a day when there is nothing to do, and safe to miss.
 */
export default class PruneRecords extends BaseCommand {
  static commandName = 'prune:records'
  static description = 'Delete expired proof photos and addresses nothing points at any more'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const photos = await this.prunePhotos()
    const addresses = await this.pruneAddresses()

    this.logger.info(`Removed ${photos} proof photo(s) past ${PHOTO_RETENTION_DAYS} days.`)
    this.logger.info(`Removed ${addresses} orphaned address(es).`)
  }

  /**
   * Deletes the stored image behind every proof action older than the
   * retention window, and blanks the column that pointed at it.
   *
   * A file that has already gone — deleted by hand, lost in a disk move — is
   * not an error worth stopping for; the column still needs clearing, and the
   * end state is the same either way.
   */
  private async prunePhotos(): Promise<number> {
    const cutoff = DateTime.now().minus({ days: PHOTO_RETENTION_DAYS })

    const expired = await OrderAction.query()
      .whereNotNull('photo_path')
      .where('created_at', '<', cutoff.toSQL()!)

    const disk = drive.use()
    let removed = 0

    for (const action of expired) {
      const key = this.keyFor(action.photoPath!)

      if (key) {
        try {
          await disk.delete(key)
        } catch (error) {
          this.logger.warning(`Could not delete ${key}: ${(error as Error).message}`)
        }
      }

      await action.merge({ photoPath: null }).save()
      removed++
    }

    return removed
  }

  private async pruneAddresses(): Promise<number> {
    const addressService = await this.app.container.make(AddressService)

    return addressService.deleteOrphanedAddresses()
  }

  /**
   * Recovers the storage key from the signed URL that was saved in its place.
   *
   * Photos are stored under `<kind>/<uuid>.<ext>` and the column holds a
   * signed URL to that key, so the last two segments of the path are the key
   * and everything before them is the disk's public route prefix.
   */
  private keyFor(photoPath: string): string | null {
    try {
      const segments = new URL(photoPath, 'http://placeholder').pathname.split('/').filter(Boolean)

      return segments.length >= 2 ? segments.slice(-2).join('/') : null
    } catch {
      return null
    }
  }
}

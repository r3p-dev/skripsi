import ReportService from '#services/report_service'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('ReportService.resolveRange', () => {
  const service = new ReportService()

  test('defaults to the last 30 days when nothing is asked for', ({ assert }) => {
    const { from, to } = service.resolveRange({})

    assert.equal(to.toISODate(), DateTime.now().startOf('day').toISODate())
    assert.equal(from.diff(to, 'days').days, -29)
  })

  test('keeps the range that was asked for', ({ assert }) => {
    const { from, to } = service.resolveRange({
      from: DateTime.fromISO('2026-07-01'),
      to: DateTime.fromISO('2026-07-10'),
    })

    assert.equal(from.toISODate(), '2026-07-01')
    assert.equal(to.toISODate(), '2026-07-10')
  })

  /**
   * Filling the two date inputs the wrong way round is an obvious typo, and
   * answering it with an empty report reads as "there was no revenue".
   */
  test('swaps the ends when they arrive backwards', ({ assert }) => {
    const { from, to } = service.resolveRange({
      from: DateTime.fromISO('2026-07-10'),
      to: DateTime.fromISO('2026-07-01'),
    })

    assert.equal(from.toISODate(), '2026-07-01')
    assert.equal(to.toISODate(), '2026-07-10')
  })

  test('only an end date still counts back 30 days from it', ({ assert }) => {
    const { from, to } = service.resolveRange({ to: DateTime.fromISO('2026-07-30') })

    assert.equal(to.toISODate(), '2026-07-30')
    assert.equal(from.toISODate(), '2026-07-01')
  })

  test('the time of day is dropped from both ends', ({ assert }) => {
    const { from, to } = service.resolveRange({
      from: DateTime.fromISO('2026-07-01T18:30:00'),
      to: DateTime.fromISO('2026-07-10T09:15:00'),
    })

    assert.equal(from.hour, 0)
    assert.equal(to.hour, 0)
  })
})

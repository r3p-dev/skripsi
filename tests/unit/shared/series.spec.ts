import { buildDailySeries, eachDay } from '#utils/series'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const from = DateTime.fromISO('2026-07-01')
const to = DateTime.fromISO('2026-07-05')

test.group('eachDay', () => {
  test('covers both ends of the range', ({ assert }) => {
    assert.deepEqual(eachDay(from, to), [
      '2026-07-01',
      '2026-07-02',
      '2026-07-03',
      '2026-07-04',
      '2026-07-05',
    ])
  })

  test('a single-day range is one day, not none', ({ assert }) => {
    assert.deepEqual(eachDay(from, from), ['2026-07-01'])
  })

  test('a backwards range yields nothing', ({ assert }) => {
    assert.deepEqual(eachDay(to, from), [])
  })

  test('the time of day does not add or drop a day', ({ assert }) => {
    const days = eachDay(from.set({ hour: 23, minute: 59 }), to.set({ hour: 0, minute: 1 }))

    assert.lengthOf(days, 5)
  })
})

test.group('buildDailySeries', () => {
  test('fills the days the query returned nothing for', ({ assert }) => {
    const series = buildDailySeries(
      [
        { date: '2026-07-01', total: 50000 },
        { date: '2026-07-04', total: 75000 },
      ],
      from,
      to
    )

    assert.deepEqual(
      series.map((point) => point.total),
      [50000, 0, 0, 75000, 0]
    )
  })

  test('every day in the range gets a point, in order', ({ assert }) => {
    const series = buildDailySeries([], from, to)

    assert.lengthOf(series, 5)
    assert.deepEqual(
      series.map((point) => point.date),
      ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05']
    )
  })

  test('labels are short Indonesian dates for the axis', ({ assert }) => {
    const series = buildDailySeries([], from, from)

    assert.equal(series[0].label, '1 Jul')
  })

  /**
   * Postgres returns `sum()` as a string, so a series built without coercion
   * would concatenate rather than add once the chart aggregated it.
   */
  test('string totals from the database arrive as numbers', ({ assert }) => {
    const series = buildDailySeries(
      [{ date: '2026-07-01', total: '50000' as unknown as number }],
      from,
      from
    )

    assert.strictEqual(series[0].total, 50000)
  })

  test('a row outside the range is ignored rather than appended', ({ assert }) => {
    const series = buildDailySeries([{ date: '2026-06-30', total: 99000 }], from, to)

    assert.lengthOf(series, 5)
    assert.deepEqual(
      series.map((point) => point.total),
      [0, 0, 0, 0, 0]
    )
  })
})

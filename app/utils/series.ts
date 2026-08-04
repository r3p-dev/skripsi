import { DateTime } from 'luxon'

/**
 * One day of a chart, already carrying the label the axis will print.
 */
export type SeriesPoint = {
  /** ISO date, `yyyy-MM-dd`. What the chart keys and sorts on. */
  date: string
  /** Short Indonesian day label, e.g. `28 Jul`. What the axis shows. */
  label: string
  total: number
}

/**
 * Every date from `from` to `to` inclusive, as ISO strings.
 */
export function eachDay(from: DateTime, to: DateTime): string[] {
  const start = from.startOf('day')
  const end = to.startOf('day')
  const days: string[] = []

  for (let day = start; day <= end; day = day.plus({ days: 1 })) {
    days.push(day.toISODate()!)
  }

  return days
}

/**
 * Turns sparse per-day totals from a `group by` query into a continuous
 * series with a point for every day in the range.
 *
 * A chart drawn straight from grouped SQL rows silently omits the quiet days,
 * which stretches the remaining ones across the axis and makes a week with two
 * orders look as busy as a week with fourteen. Filling the gaps with zeros is
 * what makes the shape of the line honest.
 */
export function buildDailySeries(
  rows: { date: string; total: number }[],
  from: DateTime,
  to: DateTime
): SeriesPoint[] {
  const totalsByDate = new Map(rows.map((row) => [row.date, Number(row.total)]))

  return eachDay(from, to).map((date) => ({
    date,
    label: DateTime.fromISO(date).setLocale('id').toFormat('d LLL'),
    total: totalsByDate.get(date) ?? 0,
  }))
}

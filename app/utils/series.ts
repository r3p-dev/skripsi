import { DateTime } from 'luxon'

export type SeriesPoint = {
  date: string
  label: string
  total: number
}

export function eachDay(from: DateTime, to: DateTime): string[] {
  const start = from.startOf('day')
  const end = to.startOf('day')
  const days: string[] = []

  for (let day = start; day <= end; day = day.plus({ days: 1 })) {
    days.push(day.toISODate()!)
  }

  return days
}

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

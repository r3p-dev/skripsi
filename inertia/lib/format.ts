/**
 * Turning stored values into something a person reads.
 *
 * Everything crossing the wire now arrives as it is stored — amounts as
 * numbers, dates as ISO strings, statuses as their enum values — so this is
 * the one place that decides what any of it looks like in Indonesian. The
 * server used to send both the raw value and a pre-formatted one side by side
 * (`price` and `priceValue`, `status` and `statusValue`), which meant two
 * names for one fact and a standing invitation to read the wrong one.
 */

const RUPIAH = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const LONG_DATE = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const SHORT_DATE = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const DATE_TIME = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatRupiah(value: number | string | null | undefined): string {
  return RUPIAH.format(Number(value ?? 0))
}

/**
 * A date as "2 Agustus 2026".
 *
 * A missing date prints as a dash rather than "Invalid Date": plenty of them
 * legitimately have no value — a walk-in order has no pickup day — and that is
 * a blank on the page, not an error.
 */
export function formatDate(value: string | null | undefined): string {
  const date = toDate(value)

  return date ? LONG_DATE.format(date) : '-'
}

/**
 * A date as "2 Agu 2026", for tables where the long form would not fit.
 */
export function formatShortDate(value: string | null | undefined): string {
  const date = toDate(value)

  return date ? SHORT_DATE.format(date) : '-'
}

/**
 * A moment as "2 Agu 2026, 14.30", for audit trails where the time matters as
 * much as the day.
 */
export function formatDateTime(value: string | null | undefined): string {
  const date = toDate(value)

  return date ? DATE_TIME.format(date) : '-'
}

/**
 * The `yyyy-MM-dd` form a native date input expects.
 */
export function toDateInput(value: string | null | undefined): string {
  const date = toDate(value)

  return date ? date.toISOString().slice(0, 10) : ''
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

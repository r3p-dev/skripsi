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

export function formatDate(value: string | null | undefined): string {
  const date = toDate(value)

  return date ? LONG_DATE.format(date) : '-'
}

export function formatShortDate(value: string | null | undefined): string {
  const date = toDate(value)

  return date ? SHORT_DATE.format(date) : '-'
}

export function formatDateTime(value: string | null | undefined): string {
  const date = toDate(value)

  return date ? DATE_TIME.format(date) : '-'
}

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

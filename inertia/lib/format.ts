const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const longDate = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const shortDate = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
})

const dateTime = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatRupiah(value: string | number | null | undefined): string {
  return rupiah.format(Number(value ?? 0))
}

export function formatDate(value: string | null | undefined, fallback = '—'): string {
  if (!value) {
    return fallback
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? value : longDate.format(date)
}

export function formatShortDate(value: string | null | undefined, fallback = '—'): string {
  if (!value) {
    return fallback
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? value : shortDate.format(date)
}

export function formatDateTime(value: string | null | undefined, fallback = '—'): string {
  if (!value) {
    return fallback
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? value : dateTime.format(date)
}

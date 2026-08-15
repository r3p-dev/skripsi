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

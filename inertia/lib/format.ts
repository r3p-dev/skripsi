const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function formatRupiah(value: string | number | null | undefined): string {
  return rupiah.format(Number(value ?? 0))
}

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Builds a wa.me link for an Indonesian mobile number.
 *
 * Numbers are stored the way people write them locally (`08123…`), but WhatsApp
 * only accepts international format, so the leading zero becomes the 62 country
 * code. Anything already in international form is left alone.
 */
export function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const international = digits.startsWith('0') ? `62${digits.slice(1)}` : digits

  return `https://wa.me/${international}`
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

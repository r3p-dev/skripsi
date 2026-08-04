import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Builds a wa.me link for an Indonesian mobile number, which WhatsApp will
 * only accept in international form.
 */
export function whatsappUrl(phone: string) {
  return `https://wa.me/${internationalise(phone)}`
}

/**
 * A `tel:` link for the same number.
 *
 * Also normalised to international form: a driver standing at the gate may
 * well be roaming or on a second SIM, and `08123…` dialled from outside the
 * home network reaches nobody.
 */
export function telUrl(phone: string) {
  return `tel:+${internationalise(phone)}`
}

/**
 * Numbers are stored the way people write them locally (`08123…`), so the
 * leading zero becomes the 62 country code. Anything already in international
 * form is left alone.
 */
function internationalise(phone: string) {
  const digits = phone.replace(/\D/g, '')

  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

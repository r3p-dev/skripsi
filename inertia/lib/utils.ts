import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function whatsappUrl(phone: string) {
  return `https://wa.me/${internationalise(phone)}`
}

export function telUrl(phone: string) {
  return `tel:+${internationalise(phone)}`
}

function internationalise(phone: string) {
  const digits = phone.replace(/\D/g, '')

  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits
}

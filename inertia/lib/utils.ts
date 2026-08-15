import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { routes } from '@/generated/registry'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hasRoute(name: string): boolean {
  return Object.hasOwn(routes, name)
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

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { routes } from '@/generated/registry'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Whether a route name exists in the generated registry.
 *
 * Read this as "hide the link rather than crash on it". A name that no longer
 * exists is simply absent: callers that filter on it fail quietly, so renaming
 * a route can make a menu entry disappear with no warning and no error. Check
 * the nav lists in the layouts by hand whenever a route name changes.
 */
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

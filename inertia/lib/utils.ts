import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert pattern Adonis/Tuyau -> RegExp
 * contoh:
 * /orders/:number -> ^/orders/[^/]+$
 */
export function patternToRegex(pattern: string) {
  return new RegExp('^' + pattern.replace(/:\w+/g, '[^/]+').replace(/\//g, '\\/') + '$')
}

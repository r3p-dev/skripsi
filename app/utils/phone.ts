/**
 * Normalize Indonesian mobile numbers to international format without a plus sign.
 *
 * Supported examples:
 * - 08123456789 -> 628123456789
 * - 8123456789 -> 628123456789
 * - +628123456789 -> 628123456789
 * - 628123456789 -> 628123456789
 *
 * @param value - Raw phone number submitted by the client.
 * @returns Normalized phone number or null when the format is invalid.
 */
export function normalizeIndonesianPhoneNumber(value: string): string | null {
  const compactPhone = value.trim().replace(/[\s().-]/g, '')

  if (!/^\+?\d+$/.test(compactPhone)) {
    return null
  }

  let normalizedPhone = compactPhone.startsWith('+') ? compactPhone.slice(1) : compactPhone

  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = `62${normalizedPhone.slice(1)}`
  }

  if (normalizedPhone.startsWith('8')) {
    normalizedPhone = `62${normalizedPhone}`
  }

  return /^628[1-9]\d{7,11}$/.test(normalizedPhone) ? normalizedPhone : null
}

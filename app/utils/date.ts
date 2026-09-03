import { DateTime } from 'luxon'

export function formatDate(value: DateTime | null | undefined): string | null {
  return value?.setLocale('id').toLocaleString(DateTime.DATE_FULL) ?? null
}

export function formatShortDate(value: DateTime | null | undefined): string | null {
  return value?.setLocale('id').toLocaleString({ day: 'numeric', month: 'short' }) ?? null
}

export function formatDateTime(value: DateTime | null | undefined): string | null {
  return value?.setLocale('id').toLocaleString(DateTime.DATETIME_MED) ?? null
}

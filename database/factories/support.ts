import type { Faker } from '@faker-js/faker'
import { DateTime } from 'luxon'

let sequence = 0

export function nextSequence(): number {
  sequence += 1

  return sequence
}

export function uniquePhone(): string {
  return `0812${String(nextSequence()).padStart(8, '0')}`
}

export function personName(faker: Faker): string {
  const name = `${faker.person.firstName()} ${faker.person.lastName()}`
    .replace(/[^A-Za-z -]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return name.slice(0, 50).trim()
}

export function nextOrderNumber(): string {
  return `ORD${DateTime.now().toFormat('yyLL')}-${String(nextSequence()).padStart(4, '0')}`
}

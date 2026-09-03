import type Address from '#models/address'
import type Order from '#models/order'
import type User from '#models/user'
import { AddressFactory } from '#database/factories/address_factory'
import { ItemFactory } from '#database/factories/item_factory'
import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { ItemType } from '#enums/item_enum'
import type { ApiResponse } from '@japa/api-client'
import { errors as vineErrors } from '@vinejs/vine'
import router from '@adonisjs/core/services/router'
import { DateTime } from 'luxon'

export function inputErrors(response: ApiResponse): Record<string, string[]> {
  return (response.flashMessages().inputErrorsBag ?? {}) as Record<string, string[]>
}

let routesCommitted = false

export function commitRoutes(): void {
  if (routesCommitted) {
    return
  }

  router.commit()
  routesCommitted = true
}

export type ValidationMessage = { field: string; message: string }

export async function validationMessages(
  action: () => Promise<unknown>
): Promise<ValidationMessage[]> {
  try {
    await action()
  } catch (error) {
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return error.messages as ValidationMessage[]
    }

    throw error
  }

  throw new Error('Expected the action to fail validation, but it succeeded.')
}

export async function invalidFields(action: () => Promise<unknown>): Promise<string[]> {
  const messages = await validationMessages(action)

  return messages.map((message) => message.field)
}

export async function createCustomer(): Promise<{ user: User; address: Address }> {
  const user = await UserFactory.create()
  const address = await AddressFactory.merge({ userId: user.id }).create()

  return { user, address }
}

export async function createOrder(
  owner: { user: User; address: Address | null },
  options: { states?: string[]; itemCount?: number; attributes?: Record<string, unknown> } = {}
): Promise<Order> {
  const builder = OrderFactory.merge({
    userId: owner.user.id,
    addressId: owner.address?.id ?? null,
    customerName: owner.address?.name ?? owner.user.name,
    customerPhone: owner.address?.phone ?? owner.user.phone,
    ...options.attributes,
  })

  const withStates = options.states?.length
    ? builder.apply(...(options.states as never[]))
    : builder

  const itemCount = options.itemCount ?? 1

  return (itemCount > 0 ? withStates.with('items', itemCount) : withStates).create()
}

export async function createItems(order: Order, count: number, state?: 'shoe' | 'bag' | 'helmet') {
  const builder = ItemFactory.merge({ orderId: order.id })

  return (state ? builder.apply(state) : builder).createMany(count)
}

export function itemFields(items: Record<string, string>[]): Record<string, string> {
  return Object.fromEntries(
    items.flatMap((item, index) =>
      Object.entries(item).map(([key, value]) => [`items[${index}][${key}]`, value])
    )
  )
}

export function itemPayload(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    type: ItemType.SHOE,
    brand: 'Nike',
    model: 'Air Force 1',
    size: '42',
    material: 'Kanvas',
    ...overrides,
  }
}

export function withConfirmation<T>(payload: Record<string, string>): T {
  return payload as T
}

export function tomorrow(): string {
  return DateTime.now().plus({ days: 1 }).toISODate()!
}

export function today(): string {
  return DateTime.now().toISODate()!
}

export const PNG_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

export function toRelativeUrl(url: string): string {
  const parsed = new URL(url)

  return `${parsed.pathname}${parsed.search}`
}

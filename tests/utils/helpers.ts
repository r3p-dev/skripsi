import { Role, type Role as UserRole } from '#enums/role_enum'
import Order from '#models/order'
import User from '#models/user'

/**
 * Shared test helpers to reduce repetition across functional tests.
 *
 * - Entity factory helpers: create users, addresses, orders with sensible defaults.
 * - Client request helpers: wrap common request patterns (Inertia + CSRF + referer).
 *
 * These helpers keep the specs clean and make it easier to debug where failures occur.
 */

/**
 * Create a user with sensible defaults. Override any field via `overrides`.
 */
export async function createUser(
  overrides: Partial<{
    phone: string
    name: string
    password: string
    role: UserRole
  }> = {}
): Promise<User> {
  return User.create({
    phone: overrides.phone ?? `6281387882973`,
    name: overrides.name ?? 'Test User',
    password: overrides.password ?? 'secret123',
    role: overrides.role ?? Role.CUSTOMER,
  })
}

export async function createOrder() {
  return Order.create({})
}

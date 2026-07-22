/**
 * Enum representing the role of a user.
 */
export const Role = {
  CUSTOMER: 'customer',
  STAFF: 'staff',
  ADMIN: 'admin',
} as const

/**
 * Type representing the role of a user.
 */
export type Role = (typeof Role)[keyof typeof Role]

/**
 * Customer-facing labels for user roles.
 */
export const RoleLabel = {
  [Role.CUSTOMER]: 'Pelanggan',
  [Role.STAFF]: 'Petugas',
  [Role.ADMIN]: 'Admin',
} as const

/**
 * Redirect paths for each role.
 */
export const RoleRedirect = {
  [Role.CUSTOMER]: 'customer.order.create',
  [Role.STAFF]: 'staff.task.index',
  [Role.ADMIN]: 'admin.dashboard.index',
} as const

export const Role = {
  CUSTOMER: 'customer',
  STAFF: 'staff',
  ADMIN: 'admin',
} as const

export const RoleLabel = {
  [Role.CUSTOMER]: 'Pelanggan',
  [Role.STAFF]: 'Petugas',
  [Role.ADMIN]: 'Admin',
} as const

export type Role = (typeof Role)[keyof typeof Role]

export const LoginRedirect = {
  [Role.CUSTOMER]: 'customer.orders.create',
  [Role.STAFF]: 'staff.profile.show',
  [Role.ADMIN]: 'admin.profile.show',
} as const

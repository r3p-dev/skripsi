import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { name, password, phone } from '#validators/shared'

/**
 * Validate credentials for session login.
 */
export const loginValidator = vine.create({
  phone: phone(),
  password: password(),
  rememberMe: vine.boolean().optional(),
})

/**
 * Validate customer registration payload.
 */
export const signupValidator = vine.create({
  name: name(),
  phone: phone().unique({ table: 'users', column: 'phone' }),
  password: password().confirmed({ as: 'passwordConfirm' }),
})

/**
 * Validate forgot-password requests without exposing account existence.
 */
export const forgotPasswordValidator = vine.create({
  phone: phone(),
})

/**
 * Validate password reset through a WhatsApp magic-link token.
 */
export const resetPasswordValidator = vine.create({
  password: password().confirmed({ as: 'passwordConfirm' }),
})

/**
 * Validate authenticated password changes.
 */
export const changePasswordValidator = vine.create({
  currentPassword: password(),
  password: password().confirmed({ as: 'passwordConfirm' }),
})

/**
 * Type definitions for authentication data.
 */
export type LoginData = Infer<typeof loginValidator>
export type SignupData = Infer<typeof signupValidator>
export type ForgotPasswordData = Infer<typeof forgotPasswordValidator>
export type ResetPasswordData = Infer<typeof resetPasswordValidator>
export type ChangePasswordData = Infer<typeof changePasswordValidator>

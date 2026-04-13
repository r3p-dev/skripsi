import vine from '@vinejs/vine'
import { amount } from './validator.ts'

export const transactionValidator = vine.create({
  amount: amount(),
})

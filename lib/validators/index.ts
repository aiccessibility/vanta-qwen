export { loginSchema, signupSchema } from './auth'
export { forgotPasswordSchema, resetPasswordSchema } from './auth'
export type { LoginFormData, SignupFormData, ForgotPasswordFormData, ResetPasswordFormData } from './auth'

import { z } from 'zod'

export const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category: z.string(),
  date: z.string(),
})

export const documentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string(),
  file: z.instanceof(File).optional(),
})

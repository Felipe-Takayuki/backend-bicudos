import { z } from 'zod';
import { Role } from '@prisma/client';

export const passwordValidation = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .max(100, 'A senha não pode exceder 100 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres').max(100, 'O nome não pode exceder 100 caracteres'),
  email: z.string().trim().toLowerCase().email('Formato de e-mail inválido'),
  password: passwordValidation,
  role: z.nativeEnum(Role).optional().default(Role.OPERATOR),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Formato de e-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'O refresh token é obrigatório'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'A senha atual é obrigatória'),
  newPassword: passwordValidation,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

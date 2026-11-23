import { z } from 'zod'

export const RolSchema = z.enum(['USER', 'STAFF', 'ADMIN'])
export type Rol = z.infer<typeof RolSchema>

export const LoginRequestSchema = z.object({
  identifier: z.string().min(1, 'Ingresa tu usuario o correo'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
export type LoginRequest = z.infer<typeof LoginRequestSchema>

export const AuthResponseSchema = z
  .object({
    accessToken: z.string().min(1),
    tokenType: z.literal('Bearer'),
    expiresIn: z.number().int().positive(),
  })
  .passthrough()
export type AuthResponse = z.infer<typeof AuthResponseSchema>

export const AuthenticatedUserResponseSchema = z
  .object({
    id: z.number().int(),
    username: z.string(),
    email: z.string(),
    active: z.boolean(),
    roles: z.array(RolSchema),
  })
  .passthrough()
export type AuthenticatedUserResponse = z.infer<typeof AuthenticatedUserResponseSchema>

export const ErrorResponseSchema = z
  .object({
    timestamp: z.string(),
    status: z.number().int(),
    error: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.string()),
  })
  .passthrough()
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

export const TokenGuardadoSchema = z.object({
  token: z.string().min(1),
  expiraEn: z.number().int(),
})
export type TokenGuardado = z.infer<typeof TokenGuardadoSchema>

export type Sesion =
  | { estado: 'cargando' }
  | { estado: 'anonimo' }
  | {
      estado: 'autenticado'
      token: string
      expiraEn: number
      usuario: AuthenticatedUserResponse
    }

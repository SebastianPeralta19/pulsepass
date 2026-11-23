import { http } from '../../lib/http'
import {
  AuthResponseSchema,
  AuthenticatedUserResponseSchema,
  LoginRequestSchema,
} from './tipos'
import type { LoginRequest } from './tipos'

export function login(datos: LoginRequest) {
  return http('/auth/login', {
    metodo: 'POST',
    cuerpo: LoginRequestSchema.parse(datos),
    esquema: AuthResponseSchema,
  })
}

export function obtenerPerfil() {
  return http('/auth/me', { esquema: AuthenticatedUserResponseSchema, autenticado: true })
}

import { conParametros, http } from '../../lib/http'
import { RegistroUsuarioSchema, UserResponseSchema } from './tipos'
import type { RegistroUsuarioForm } from './tipos'

export function registrar(datos: RegistroUsuarioForm) {
  return http('/users', {
    metodo: 'POST',
    cuerpo: RegistroUsuarioSchema.parse(datos),
    esquema: UserResponseSchema,
  })
}

export function obtenerPorEmail(email: string) {
  return http(conParametros('/users/by-email', { email }), {
    esquema: UserResponseSchema,
    autenticado: true,
  })
}

export function obtenerPorUsername(username: string) {
  return http(conParametros('/users/by-username', { username }), {
    esquema: UserResponseSchema,
    autenticado: true,
  })
}

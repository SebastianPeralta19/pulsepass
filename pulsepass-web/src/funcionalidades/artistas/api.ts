import { conParametros, http } from '../../lib/http'
import { ArtistResponseSchema } from './tipos'

export function listarActivos() {
  return http('/artists/active', { esquema: ArtistResponseSchema.array() })
}

export function obtenerPorId(id: number) {
  return http(`/artists/${id}`, { esquema: ArtistResponseSchema })
}

export function obtenerPorNombre(stageName: string) {
  return http(conParametros('/artists/by-stage-name', { stageName }), {
    esquema: ArtistResponseSchema,
  })
}

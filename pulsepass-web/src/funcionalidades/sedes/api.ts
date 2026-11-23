import { http } from '../../lib/http'
import { VenueResponseSchema } from './tipos'

export function listarActivas() {
  return http('/venues/active', { esquema: VenueResponseSchema.array() })
}

export function obtenerPorCodigo(code: string) {
  return http(`/venues/${encodeURIComponent(code)}`, { esquema: VenueResponseSchema })
}

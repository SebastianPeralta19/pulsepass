import { conParametros, http } from '../../lib/http'
import {
  CrearEventoSchema,
  EventResponseSchema,
  EventSummaryResponseSchema,
} from './tipos'
import type { CrearEventoForm } from './tipos'

export function listarPublicados() {
  return http('/events/published', { esquema: EventSummaryResponseSchema.array() })
}

export function obtenerPorCodigo(eventCode: string) {
  return http(`/events/${encodeURIComponent(eventCode)}`, { esquema: EventResponseSchema })
}

export function listarPorArtista(stageName: string) {
  return http(conParametros('/events/by-artist', { stageName }), {
    esquema: EventSummaryResponseSchema.array(),
  })
}

export function crear(datos: CrearEventoForm) {
  return http('/events', {
    metodo: 'POST',
    cuerpo: CrearEventoSchema.parse(datos),
    esquema: EventResponseSchema,
    autenticado: true,
  })
}

export function publicar(eventCode: string) {
  return http(`/events/${encodeURIComponent(eventCode)}/publish`, {
    metodo: 'PATCH',
    esquema: EventResponseSchema,
    autenticado: true,
  })
}

export function asociarArtista(eventCode: string, artistId: number) {
  return http(`/events/${encodeURIComponent(eventCode)}/artists/${artistId}`, {
    metodo: 'POST',
    esquema: EventResponseSchema,
    autenticado: true,
  })
}

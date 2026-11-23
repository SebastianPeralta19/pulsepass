import { conParametros, http } from '../../lib/http'
import { TicketResponseSchema } from './tipos'
import type { TicketType } from './tipos'

export function comprar(userEmail: string, eventCode: string, type: TicketType) {
  return http('/tickets', {
    metodo: 'POST',
    cuerpo: { userEmail, eventCode, type },
    esquema: TicketResponseSchema,
    autenticado: true,
  })
}

export function listarPorUsuario(email: string) {
  return http(conParametros('/tickets/by-user', { email }), {
    esquema: TicketResponseSchema.array(),
    autenticado: true,
  })
}

export function obtenerPorCodigo(ticketCode: string) {
  return http(`/tickets/${encodeURIComponent(ticketCode)}`, {
    esquema: TicketResponseSchema,
    autenticado: true,
  })
}

export function listarPagados(eventCode: string) {
  return http(`/events/${encodeURIComponent(eventCode)}/tickets/paid`, {
    esquema: TicketResponseSchema.array(),
    autenticado: true,
  })
}

export function cancelar(ticketCode: string) {
  return http(`/tickets/${encodeURIComponent(ticketCode)}/cancel`, {
    metodo: 'PATCH',
    esquema: TicketResponseSchema,
    autenticado: true,
  })
}

export function usar(ticketCode: string) {
  return http(`/tickets/${encodeURIComponent(ticketCode)}/use`, {
    metodo: 'PATCH',
    esquema: TicketResponseSchema,
    autenticado: true,
  })
}

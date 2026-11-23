import { ApiError } from '../lib/http'

export function mensajeCancelacionTicket(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Ocurrió un error inesperado. Inténtalo más tarde.'
  }
  if (error.status === 409) return error.message
  if (error.status === 403 || error.status === 404) return 'Ticket no disponible'
  if (error.status === 400) {
    return Object.values(error.details).join(' ') || error.message || 'Revisa los datos.'
  }
  if (error.status === 0) {
    return 'No pudimos conectar con el servidor. Inténtalo más tarde.'
  }
  if (error.status >= 500) {
    return 'Ocurrió un error inesperado. Inténtalo más tarde.'
  }
  return error.message
}

export function mensajeCargaTicket(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos cargar el ticket.'
}

export function esTicketNoDisponible(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 403 || error.status === 404)
}

export function mensajeCargaIngreso(error: unknown): string {
  if (esTicketNoDisponible(error)) return 'Ticket no disponible'
  if (error instanceof ApiError && error.status === 0) {
    return 'No pudimos conectar con el servidor.'
  }
  if (error instanceof ApiError && error.status >= 500) {
    return 'Ocurrió un error inesperado. Inténtalo más tarde.'
  }
  return error instanceof Error ? error.message : 'No pudimos cargar el ticket.'
}

export function mensajeUsoTicket(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403 || error.status === 404) return 'Ticket no disponible'
    if (error.status === 409) return error.message
    if (error.status === 400) {
      return Object.values(error.details).join(' ') || error.message || 'Revisa los datos.'
    }
    if (error.status === 0) return 'No pudimos conectar con el servidor.'
    if (error.status >= 500) return 'Ocurrió un error inesperado. Inténtalo más tarde.'
    return error.message
  }
  return 'Ocurrió un error inesperado. Inténtalo más tarde.'
}

import { http, HttpResponse } from 'msw'
import {
  artistas,
  authResponse,
  evento,
  eventoResumen,
  sede,
  ticketAndrea,
  tickets,
  usuarioAutenticado,
  usuarioPerfil,
} from './fixtures'

const BASE = 'http://localhost/api'

const ETIQUETAS_ESTADO: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
}

export function cuerpoError(
  status: number,
  message: string,
  details: Record<string, string> = {},
) {
  return {
    timestamp: '2026-11-22T12:00:00',
    status,
    error: ETIQUETAS_ESTADO[status] ?? 'Error',
    message,
    details,
  }
}

export function respuestaError(
  status: number,
  message: string,
  details: Record<string, string> = {},
) {
  return HttpResponse.json(cuerpoError(status, message, details), { status })
}

export const handlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const cuerpo = (await request.json()) as { identifier?: string }
    if (cuerpo.identifier === 'miguel') {
      return respuestaError(401, 'Bad credentials')
    }
    return HttpResponse.json(authResponse)
  }),
  http.get(`${BASE}/auth/me`, () => HttpResponse.json(usuarioAutenticado)),

  http.post(`${BASE}/users`, async () => HttpResponse.json(usuarioPerfil, { status: 201 })),
  http.get(`${BASE}/users/by-email`, () => HttpResponse.json(usuarioPerfil)),
  http.get(`${BASE}/users/by-username`, () => HttpResponse.json(usuarioPerfil)),

  http.get(`${BASE}/events/published`, () => HttpResponse.json([eventoResumen])),
  http.get(`${BASE}/events/by-artist`, () => HttpResponse.json([eventoResumen])),
  http.get(`${BASE}/events/:eventCode/tickets/paid`, () =>
    HttpResponse.json(tickets.filter((ticket) => ticket.status === 'PAID')),
  ),
  http.get(`${BASE}/events/:eventCode`, ({ params }) =>
    String(params.eventCode) === evento.eventCode
      ? HttpResponse.json(evento)
      : respuestaError(404, 'Event not found'),
  ),
  http.post(`${BASE}/events`, () => HttpResponse.json({ ...evento, status: 'DRAFT' }, { status: 201 })),
  http.patch(`${BASE}/events/:eventCode/publish`, () =>
    HttpResponse.json({ ...evento, status: 'PUBLISHED' }),
  ),
  http.post(`${BASE}/events/:eventCode/artists/:artistId`, () => HttpResponse.json(evento)),

  http.get(`${BASE}/artists/active`, () => HttpResponse.json(artistas)),
  http.get(`${BASE}/artists/by-stage-name`, ({ request }) => {
    const nombre = new URL(request.url).searchParams.get('stageName')
    const encontrado = artistas.find((artista) => artista.stageName === nombre)
    return encontrado
      ? HttpResponse.json(encontrado)
      : respuestaError(404, 'Artist not found')
  }),
  http.get(`${BASE}/artists/:id`, ({ params }) => {
    const id = Number(params.id)
    const encontrado = artistas.find((artista) => artista.id === id)
    return encontrado
      ? HttpResponse.json(encontrado)
      : respuestaError(404, 'Artist not found')
  }),

  http.get(`${BASE}/venues/active`, () => HttpResponse.json([sede])),
  http.get(`${BASE}/venues/:code`, ({ params }) =>
    String(params.code) === sede.code
      ? HttpResponse.json(sede)
      : respuestaError(404, 'Venue not found'),
  ),

  http.post(`${BASE}/tickets`, () => HttpResponse.json(ticketAndrea, { status: 201 })),
  http.get(`${BASE}/tickets/by-user`, ({ request }) => {
    const email = new URL(request.url).searchParams.get('email') ?? ''
    return HttpResponse.json(tickets.filter((ticket) => ticket.userEmail === email))
  }),
  http.get(`${BASE}/tickets/:ticketCode`, ({ params }) => {
    const codigo = String(params.ticketCode)
    const encontrado = tickets.find((ticket) => ticket.ticketCode === codigo)
    return encontrado
      ? HttpResponse.json(encontrado)
      : respuestaError(404, 'Ticket not found')
  }),
  http.patch(`${BASE}/tickets/:ticketCode/cancel`, ({ params }) => {
    const encontrado = tickets.find(
      (ticket) => ticket.ticketCode === String(params.ticketCode),
    )
    return encontrado
      ? HttpResponse.json({ ...encontrado, status: 'CANCELLED' })
      : respuestaError(404, 'Ticket not found')
  }),
  http.patch(`${BASE}/tickets/:ticketCode/use`, ({ params }) => {
    const encontrado = tickets.find(
      (ticket) => ticket.ticketCode === String(params.ticketCode),
    )
    return encontrado
      ? HttpResponse.json({ ...encontrado, status: 'USED' })
      : respuestaError(404, 'Ticket not found')
  }),
]

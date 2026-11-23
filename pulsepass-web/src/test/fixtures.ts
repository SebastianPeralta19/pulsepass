import type { ArtistResponse } from '../funcionalidades/artistas/tipos'
import type { AuthResponse, AuthenticatedUserResponse } from '../funcionalidades/auth/tipos'
import type { EventResponse, EventSummaryResponse } from '../funcionalidades/eventos/tipos'
import type { VenueResponse } from '../funcionalidades/sedes/tipos'
import type { TicketResponse } from '../funcionalidades/tickets/tipos'
import type { UserResponse } from '../funcionalidades/usuarios/tipos'

export const sede: VenueResponse = {
  id: 1,
  code: 'VEN-SMR-01',
  name: 'Marina Convention Center',
  city: 'Santa Marta',
  address: 'Calle 10 # 2-30',
  capacity: 3,
  active: true,
}

export const artistas: ArtistResponse[] = [
  { id: 1, stageName: 'Solar Beat', country: 'CO', genre: 'Electrónica', active: true },
  { id: 2, stageName: 'Neon Waves', country: 'CO', genre: 'Pop', active: true },
  { id: 3, stageName: 'Caribbean Sound', country: 'CO', genre: 'Folk', active: true },
]

export const eventoResumen: EventSummaryResponse = {
  id: 1,
  eventCode: 'CMF-2026',
  name: 'Caribbean Music Fest 2026',
  category: 'MUSIC',
  status: 'PUBLISHED',
  eventDate: '2026-12-15T20:00:00',
  venueCode: sede.code,
  venueName: sede.name,
}

export const evento: EventResponse = {
  ...eventoResumen,
  description: 'Tres noches de música en Santa Marta.',
  minimumAge: 18,
  artists: artistas,
}

export const usuarioAutenticado: AuthenticatedUserResponse = {
  id: 1,
  username: 'andrea',
  email: 'andrea@example.com',
  active: true,
  roles: ['USER'],
}

export const usuarioStaff: AuthenticatedUserResponse = {
  id: 2,
  username: 'laura',
  email: 'laura@example.com',
  active: true,
  roles: ['STAFF'],
}

export const usuarioAdmin: AuthenticatedUserResponse = {
  id: 3,
  username: 'admin',
  email: 'admin@example.com',
  active: true,
  roles: ['ADMIN'],
}

export const authResponse: AuthResponse = {
  accessToken: 'token-de-prueba',
  tokenType: 'Bearer',
  expiresIn: 900,
}

export const usuarioPerfil: UserResponse = {
  id: 1,
  username: 'andrea',
  email: 'andrea@example.com',
  active: true,
  firstName: 'Andrea',
  lastName: 'Pérez',
  phone: null,
  city: 'Santa Marta',
  birthDate: '1998-04-12',
}

export const ticketAndrea: TicketResponse = {
  id: 1,
  ticketCode: 'TKT-AND-001',
  type: 'VIP',
  price: 250000,
  status: 'PAID',
  purchaseDate: '2026-11-01T10:00:00',
  userEmail: 'andrea@example.com',
  eventCode: 'CMF-2026',
  eventName: 'Caribbean Music Fest 2026',
}

export const ticketCarlos: TicketResponse = {
  id: 2,
  ticketCode: 'TKT-CAR-001',
  type: 'GENERAL',
  price: 120000,
  status: 'PAID',
  purchaseDate: '2026-11-02T11:00:00',
  userEmail: 'carlos@example.com',
  eventCode: 'CMF-2026',
  eventName: 'Caribbean Music Fest 2026',
}

export const tickets = [ticketAndrea, ticketCarlos]

export const RUTAS = {
  inicio: '/',
  eventos: '/eventos',
  evento: (eventCode: string) => `/eventos/${encodeURIComponent(eventCode)}`,
  artistas: '/artistas',
  artista: (id: number) => `/artistas/${id}`,
  sedes: '/sedes',
  sede: (code: string) => `/sedes/${encodeURIComponent(code)}`,
  login: '/login',
  registro: '/registro',
  cuenta: '/cuenta',
  misTickets: '/mis-tickets',
  detalleTicket: (ticketCode: string) => `/mis-tickets/${encodeURIComponent(ticketCode)}`,
  confirmacionCompra: (ticketCode: string) =>
    `/compra/confirmacion/${encodeURIComponent(ticketCode)}`,
  validacionIngreso: '/staff/validacion',
  ticketsPagados: (eventCode: string) =>
    `/staff/eventos/${encodeURIComponent(eventCode)}/tickets`,
  adminEventos: '/admin/eventos',
  adminCrearEvento: '/admin/eventos/nuevo',
  adminGestionEvento: (eventCode: string) =>
    `/admin/eventos/${encodeURIComponent(eventCode)}`,
  sinPermisos: '/403',
} as const

export const EVENTO_DEMO = 'CMF-2026'

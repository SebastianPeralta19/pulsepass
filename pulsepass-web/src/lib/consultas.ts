export const CLAVES = {
  eventosPublicados: ['eventos', 'publicados'] as const,
  evento: (eventCode: string) => ['evento', eventCode] as const,
  eventosPorArtista: (stageName: string) => ['eventos', 'artista', stageName] as const,
  artistasActivos: ['artistas', 'activos'] as const,
  artista: (id: number) => ['artista', id] as const,
  sedesActivas: ['sedes', 'activas'] as const,
  sede: (code: string) => ['sede', code] as const,
  usuario: (email: string) => ['usuario', email] as const,
  ticketsUsuario: (email: string) => ['tickets', 'usuario', email] as const,
  ticket: (ticketCode: string) => ['ticket', ticketCode] as const,
  ticketsPagados: (eventCode: string) => ['tickets', 'pagados', eventCode] as const,
}

export const TIEMPOS = {
  eventosPublicados: 60_000,
  evento: 30_000,
  eventosPorArtista: 60_000,
  artistasActivos: 300_000,
  artista: 300_000,
  sedesActivas: 300_000,
  sede: 300_000,
  usuario: 60_000,
  ticketsUsuario: 15_000,
  ticket: 15_000,
  ticketsPagados: 15_000,
}

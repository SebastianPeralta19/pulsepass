export function mensajeErrorCarga(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos cargar la información.'
}

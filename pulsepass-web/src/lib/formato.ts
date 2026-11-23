export function formatearCOP(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
  }).format(valor)
}

function partesFecha(iso: string): Date | null {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(iso)
  if (!coincidencia) return null
  const [, anio, mes, dia, hora, minuto] = coincidencia
  if (!anio || !mes || !dia) return null
  return new Date(
    Number(anio),
    Number(mes) - 1,
    Number(dia),
    Number(hora ?? 0),
    Number(minuto ?? 0),
  )
}

export function formatearFecha(iso: string, conHora = false): string {
  const fecha = partesFecha(iso)
  if (!fecha || Number.isNaN(fecha.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(conHora ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  }).format(fecha)
}

export function formatearHora(iso: string): string {
  const fecha = partesFecha(iso)
  if (!fecha || Number.isNaN(fecha.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha)
}

export function aValorLocalDateTime(iso: string): string {
  const fecha = partesFecha(iso)
  if (!fecha || Number.isNaN(fecha.getTime())) return ''
  const dos = (numero: number) => String(numero).padStart(2, '0')
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`
}

import type { EventCategory } from '../funcionalidades/eventos/tipos'

export const ETIQUETAS_CATEGORIA: Record<EventCategory, string> = {
  MUSIC: 'Música',
  SPORTS: 'Deportes',
  TECHNOLOGY: 'Tecnología',
  EDUCATION: 'Educación',
  CULTURE: 'Cultura',
  ENTERTAINMENT: 'Entretenimiento',
}

export default function EtiquetaCategoria({
  categoria,
  className,
}: {
  categoria: EventCategory
  className?: string
}) {
  return <span className={className}>{ETIQUETAS_CATEGORIA[categoria]}</span>
}

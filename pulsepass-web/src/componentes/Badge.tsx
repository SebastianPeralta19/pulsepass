import type { EventStatus } from '../funcionalidades/eventos/tipos'
import type { TicketStatus } from '../funcionalidades/tickets/tipos'
import clsx from 'clsx'

const CLASES_ESTADO_EVENTO: Record<EventStatus, string> = {
  DRAFT: 'bg-slate-200 text-slate-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  SOLD_OUT: 'bg-amber-100 text-amber-800',
  CANCELLED: 'bg-red-100 text-red-800',
  FINISHED: 'bg-slate-300 text-slate-800',
}

const CLASES_ESTADO_TICKET: Record<TicketStatus, string> = {
  RESERVED: 'bg-sky-100 text-sky-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  USED: 'bg-slate-300 text-slate-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

type Estado = EventStatus | TicketStatus

interface BadgeProps {
  estado: Estado
  className?: string
}

export default function Badge({ estado, className }: BadgeProps) {
  const clases: Record<Estado, string> = {
    ...CLASES_ESTADO_EVENTO,
    ...CLASES_ESTADO_TICKET,
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        clases[estado],
        className,
      )}
    >
      {estado}
    </span>
  )
}

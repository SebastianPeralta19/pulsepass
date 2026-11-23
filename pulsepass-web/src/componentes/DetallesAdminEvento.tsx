import { IconoCalendario } from './Iconos'
import { ETIQUETAS_CATEGORIA } from './EtiquetaCategoria'
import type { EventResponse } from '../funcionalidades/eventos/tipos'
import { formatearFecha, formatearHora } from '../lib/formato'

export default function DetallesAdminEvento({ evento }: { evento: EventResponse }) {
  return (
    <dl className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Categoría
        </dt>
        <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
          {ETIQUETAS_CATEGORIA[evento.category]}
        </dd>
      </div>
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Fecha y hora
        </dt>
        <dd className="mt-1 flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
          <IconoCalendario className="h-4 w-4 shrink-0" />
          {formatearFecha(evento.eventDate)} · {formatearHora(evento.eventDate)}
        </dd>
      </div>
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Edad mínima
        </dt>
        <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
          {evento.minimumAge === null ? 'Sin restricción' : `${evento.minimumAge} años`}
        </dd>
      </div>
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Sede
        </dt>
        <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
          {evento.venueName ?? 'Sede por definir'}
        </dd>
      </div>
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800 sm:col-span-2">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Descripción
        </dt>
        <dd className="mt-1 whitespace-pre-line text-slate-700 dark:text-slate-300">
          {evento.description ?? 'Sin descripción disponible.'}
        </dd>
      </div>
    </dl>
  )
}

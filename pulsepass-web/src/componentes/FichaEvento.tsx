import Badge from './Badge'
import { CodigoTexto } from './CodigoTexto'
import EtiquetaCategoria from './EtiquetaCategoria'
import { IconoCalendario } from './Iconos'
import Tarjeta from './Tarjeta'
import type { EventResponse } from '../funcionalidades/eventos/tipos'
import { formatearFecha, formatearHora } from '../lib/formato'

export default function FichaEvento({ evento }: { evento: EventResponse }) {
  return (
    <Tarjeta className="p-6">
      <div className="flex flex-wrap items-center gap-2">
        <EtiquetaCategoria
          categoria={evento.category}
          className="rounded-full bg-marca-50 px-2.5 py-1 text-xs font-semibold text-marca-700 dark:bg-slate-800 dark:text-marca-500"
        />
        <Badge estado={evento.status} />
      </div>
      <h1 className="mt-4 font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
        {evento.name}
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Código: <CodigoTexto>{evento.eventCode}</CodigoTexto>
      </p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Fecha
          </dt>
          <dd className="mt-1 flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
            <IconoCalendario className="h-4 w-4 shrink-0" />
            {formatearFecha(evento.eventDate)}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Hora
          </dt>
          <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
            {formatearHora(evento.eventDate)}
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
      </dl>
      <h2 className="mt-8 font-titulo text-xl font-bold">Descripción</h2>
      <p className="mt-2 whitespace-pre-line text-slate-600 dark:text-slate-400">
        {evento.description ?? 'Sin descripción disponible.'}
      </p>
    </Tarjeta>
  )
}

import { Link } from 'react-router'
import Badge from './Badge'
import EtiquetaCategoria from './EtiquetaCategoria'
import { IconoCalendario, IconoUbicacion } from './Iconos'
import Tarjeta from './Tarjeta'
import type { EventSummaryResponse } from '../funcionalidades/eventos/tipos'
import { formatearFecha } from '../lib/formato'
import { RUTAS } from '../lib/rutas'

export default function TarjetaEventoCatalogo({ evento }: { evento: EventSummaryResponse }) {
  return (
    <Tarjeta className="h-full transition-shadow hover:shadow-md">
      <Link
        to={RUTAS.evento(evento.eventCode)}
        className="flex h-full flex-col gap-3 rounded-xl p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <EtiquetaCategoria
            categoria={evento.category}
            className="rounded-full bg-marca-50 px-2.5 py-1 text-xs font-semibold text-marca-700 dark:bg-slate-800 dark:text-marca-500"
          />
          <Badge estado={evento.status} />
        </div>
        <h2 className="font-titulo text-xl font-bold text-slate-900 dark:text-slate-100">
          {evento.name}
        </h2>
        <dl className="mt-auto space-y-1 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <IconoCalendario className="h-4 w-4 shrink-0" />
            <dt className="sr-only">Fecha</dt>
            <dd>{formatearFecha(evento.eventDate)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <IconoUbicacion className="h-4 w-4 shrink-0" />
            <dt className="sr-only">Sede</dt>
            <dd>{evento.venueName ?? 'Sede por definir'}</dd>
          </div>
        </dl>
      </Link>
    </Tarjeta>
  )
}

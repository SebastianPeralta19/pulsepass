import { Link } from 'react-router'
import Aviso from './Aviso'
import Badge from './Badge'
import { CodigoTexto } from './CodigoTexto'
import type { EventResponse } from '../funcionalidades/eventos/tipos'
import { RUTAS } from '../lib/rutas'

export default function CabeceraAdminEvento({
  evento,
  aviso,
}: {
  evento: EventResponse
  aviso: { tipo: 'exito' | 'error'; mensaje: string } | null
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to={RUTAS.adminEventos}
            className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
          >
            ← Eventos
          </Link>
          <h1 className="mt-2 font-titulo text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
            {evento.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Código: <CodigoTexto>{evento.eventCode}</CodigoTexto>
          </p>
        </div>
        <Badge estado={evento.status} />
      </div>
      {aviso ? (
        <div className="mt-4">
          <Aviso tipo={aviso.tipo} mensaje={aviso.mensaje} />
        </div>
      ) : null}
    </>
  )
}

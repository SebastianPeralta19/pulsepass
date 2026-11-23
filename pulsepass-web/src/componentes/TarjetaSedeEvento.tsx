import { CodigoTexto } from './CodigoTexto'
import Tarjeta from './Tarjeta'
import type { EventResponse } from '../funcionalidades/eventos/tipos'
import type { VenueResponse } from '../funcionalidades/sedes/tipos'

export default function TarjetaSedeEvento({
  evento,
  sede,
}: {
  evento: EventResponse
  sede: VenueResponse | undefined
}) {
  return (
    <Tarjeta className="p-6">
      <h2 className="font-titulo text-xl font-bold">Sede</h2>
      <p className="mt-2 font-medium text-slate-900 dark:text-slate-100">
        {evento.venueName ?? 'Sede por definir'}
      </p>
      {evento.venueCode ? (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Código: <CodigoTexto>{evento.venueCode}</CodigoTexto>
        </p>
      ) : null}
      {sede ? (
        <dl className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <div>
            <dt className="font-semibold text-slate-800 dark:text-slate-200">Ciudad</dt>
            <dd>{sede.city}</dd>
          </div>
          {sede.address ? (
            <div>
              <dt className="font-semibold text-slate-800 dark:text-slate-200">Dirección</dt>
              <dd>{sede.address}</dd>
            </div>
          ) : null}
          <div>
            <dt className="font-semibold text-slate-800 dark:text-slate-200">Capacidad</dt>
            <dd>{sede.capacity} personas</dd>
          </div>
        </dl>
      ) : null}
    </Tarjeta>
  )
}

import { Link } from 'react-router'
import Cargando from './Cargando'
import EstadoError from './EstadoError'
import EstadoVacio from './EstadoVacio'
import EtiquetaCategoria from './EtiquetaCategoria'
import { IconoCalendario, IconoUbicacion } from './Iconos'
import Tarjeta from './Tarjeta'
import { mensajeErrorCarga } from './MensajesCarga'
import type { EventSummaryResponse } from '../funcionalidades/eventos/tipos'
import { formatearFecha } from '../lib/formato'
import { RUTAS } from '../lib/rutas'

export default function ListaEventosArtista({
  artista,
  eventos,
  cargando,
  error,
  onReintentar,
}: {
  artista: string
  eventos: EventSummaryResponse[] | undefined
  cargando: boolean
  error: unknown
  onReintentar: () => void
}) {
  return (
    <section aria-labelledby="eventos-artista" className="mt-10">
      <h2 id="eventos-artista" className="font-titulo text-2xl font-bold">
        Próximos eventos de {artista}
      </h2>
      <div className="mt-4">
        {cargando ? (
          <Cargando etiqueta="Cargando eventos del artista" lineas={3} />
        ) : error ? (
          <EstadoError mensaje={mensajeErrorCarga(error)} onReintentar={onReintentar} />
        ) : !eventos || eventos.length === 0 ? (
          <EstadoVacio mensaje="Sin eventos próximos" />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.map((evento) => (
              <Tarjeta key={evento.eventCode} className="h-full">
                <Link
                  to={RUTAS.evento(evento.eventCode)}
                  className="flex h-full flex-col gap-3 rounded-xl p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
                >
                  <EtiquetaCategoria
                    categoria={evento.category}
                    className="w-fit rounded-full bg-marca-50 px-2.5 py-1 text-xs font-semibold text-marca-700 dark:bg-slate-800 dark:text-marca-500"
                  />
                  <h3 className="font-titulo text-lg font-bold text-slate-900 dark:text-slate-100">
                    {evento.name}
                  </h3>
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
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

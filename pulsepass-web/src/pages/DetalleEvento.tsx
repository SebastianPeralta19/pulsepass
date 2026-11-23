import { Link, useParams } from 'react-router'
import Badge from '../componentes/Badge'
import Cargando from '../componentes/Cargando'
import EstadoError from '../componentes/EstadoError'
import EstadoVacio from '../componentes/EstadoVacio'
import Tarjeta from '../componentes/Tarjeta'
import { CodigoTexto } from '../componentes/CodigoTexto'
import { IconoCalendario, IconoFlechaIzquierda, IconoUsuario } from '../componentes/Iconos'
import { useEvento } from '../funcionalidades/eventos/hooks'
import type { EventCategory } from '../funcionalidades/eventos/tipos'
import { useSede } from '../funcionalidades/sedes/hooks'
import ComprarTicket from '../funcionalidades/tickets/ComprarTicket'
import { Contenedor } from '../layouts/Layout'
import { ApiError } from '../lib/http'
import { formatearFecha, formatearHora } from '../lib/formato'
import { RUTAS } from '../lib/rutas'

const ETIQUETAS_CATEGORIA: Record<EventCategory, string> = {
  MUSIC: 'Música',
  SPORTS: 'Deportes',
  TECHNOLOGY: 'Tecnología',
  EDUCATION: 'Educación',
  CULTURE: 'Cultura',
  ENTERTAINMENT: 'Entretenimiento',
}

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos cargar el evento.'
}

export default function DetalleEvento() {
  const { eventCode } = useParams()
  const codigo = eventCode ?? ''
  const consulta = useEvento(codigo)
  const evento = consulta.data
  const consultaSede = useSede(evento?.venueCode ?? '')

  if (consulta.error) {
    if (
      consulta.error instanceof ApiError &&
      (consulta.error.status === 403 || consulta.error.status === 404)
    ) {
      return (
        <Contenedor>
          <h1 className="font-titulo text-3xl font-bold">Evento no disponible</h1>
        </Contenedor>
      )
    }
    return (
      <Contenedor>
        <EstadoError
          mensaje={mensajeError(consulta.error)}
          onReintentar={() => void consulta.refetch()}
        />
      </Contenedor>
    )
  }

  if (consulta.isPending) {
    return (
      <Contenedor>
        <Cargando etiqueta="Cargando evento" lineas={5} />
      </Contenedor>
    )
  }

  if (!evento) {
    return (
      <Contenedor>
        <EstadoVacio mensaje="Evento no disponible" />
      </Contenedor>
    )
  }

  return (
    <Contenedor>
      <Link
        to={RUTAS.eventos}
        className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
      >
        <IconoFlechaIzquierda className="h-4 w-4" />
        Volver a la cartelera
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Tarjeta className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-marca-50 px-2.5 py-1 text-xs font-semibold text-marca-700 dark:bg-slate-800 dark:text-marca-500">
                {ETIQUETAS_CATEGORIA[evento.category]}
              </span>
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
                  {evento.minimumAge === null
                    ? 'Sin restricción'
                    : `${evento.minimumAge} años`}
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

          <Tarjeta className="p-6">
            <h2 className="font-titulo text-xl font-bold">Artistas</h2>
            {evento.artists.length === 0 ? (
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Sin artistas registrados.
              </p>
            ) : (
              <ul className="mt-4 flex flex-wrap gap-3">
                {evento.artists.map((artista) => (
                  <li key={artista.id}>
                    <Link
                      to={RUTAS.artista(artista.id)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-marca-500 hover:text-marca-700 focus-visible:outline-2 focus-visible:outline-marca-600 dark:border-slate-700 dark:text-slate-200 dark:hover:text-marca-500"
                    >
                      <IconoUsuario className="h-4 w-4 shrink-0" />
                      {artista.stageName}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>

        <aside className="space-y-6">
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
            {consultaSede.data ? (
              <dl className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">Ciudad</dt>
                  <dd>{consultaSede.data.city}</dd>
                </div>
                {consultaSede.data.address ? (
                  <div>
                    <dt className="font-semibold text-slate-800 dark:text-slate-200">Dirección</dt>
                    <dd>{consultaSede.data.address}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">Capacidad</dt>
                  <dd>{consultaSede.data.capacity} personas</dd>
                </div>
              </dl>
            ) : null}
          </Tarjeta>

          <Tarjeta className="p-6">
            <h2 className="font-titulo text-xl font-bold">Entradas</h2>
            <div className="mt-4">
              <ComprarTicket eventCode={codigo} />
            </div>
          </Tarjeta>
        </aside>
      </div>
    </Contenedor>
  )
}

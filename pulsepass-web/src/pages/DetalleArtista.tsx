import { Link, useParams } from 'react-router'
import { z } from 'zod'
import Cargando from '../componentes/Cargando'
import EstadoError from '../componentes/EstadoError'
import EstadoVacio from '../componentes/EstadoVacio'
import Tarjeta from '../componentes/Tarjeta'
import { CodigoTexto } from '../componentes/CodigoTexto'
import { IconoCalendario, IconoFlechaIzquierda, IconoUbicacion } from '../componentes/Iconos'
import { useArtista } from '../funcionalidades/artistas/hooks'
import { useEventosPorArtista } from '../funcionalidades/eventos/hooks'
import type { EventCategory } from '../funcionalidades/eventos/tipos'
import { Contenedor } from '../layouts/Layout'
import { ApiError } from '../lib/http'
import { formatearFecha } from '../lib/formato'
import { RUTAS } from '../lib/rutas'
import NoEncontrada from './NoEncontrada'

const EsquemaId = z.coerce.number().int().positive()

const ETIQUETAS_CATEGORIA: Record<EventCategory, string> = {
  MUSIC: 'Música',
  SPORTS: 'Deportes',
  TECHNOLOGY: 'Tecnología',
  EDUCATION: 'Educación',
  CULTURE: 'Cultura',
  ENTERTAINMENT: 'Entretenimiento',
}

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos cargar la información.'
}

function ContenidoArtista({ id }: { id: number }) {
  const consulta = useArtista(id)
  const artista = consulta.data
  const consultaEventos = useEventosPorArtista(artista?.stageName ?? '')

  if (consulta.error) {
    if (
      consulta.error instanceof ApiError &&
      (consulta.error.status === 403 || consulta.error.status === 404)
    ) {
      return <NoEncontrada />
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
        <Cargando etiqueta="Cargando artista" lineas={4} />
      </Contenedor>
    )
  }

  if (!artista) return <NoEncontrada />

  return (
    <Contenedor>
      <Link
        to={RUTAS.artistas}
        className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
      >
        <IconoFlechaIzquierda className="h-4 w-4" />
        Artistas
      </Link>

      <Tarjeta className="mt-4 flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <span
          aria-hidden="true"
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-marca-50 font-titulo text-4xl font-bold text-marca-700 dark:bg-slate-800 dark:text-marca-500"
        >
          {artista.stageName.charAt(0).toUpperCase() || 'A'}
        </span>
        <div>
          <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
            {artista.stageName}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Código: <CodigoTexto>{String(artista.id)}</CodigoTexto>
          </p>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <dt className="font-semibold text-slate-800 dark:text-slate-200">Género</dt>
              <dd className="text-slate-600 dark:text-slate-400">
                {artista.genre ?? 'No definido'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-800 dark:text-slate-200">País</dt>
              <dd className="text-slate-600 dark:text-slate-400">
                {artista.country ?? 'No definido'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-800 dark:text-slate-200">Estado</dt>
              <dd className="text-slate-600 dark:text-slate-400">
                {artista.active ? 'Activo' : 'Inactivo'}
              </dd>
            </div>
          </dl>
        </div>
      </Tarjeta>

      <section aria-labelledby="eventos-artista" className="mt-10">
        <h2 id="eventos-artista" className="font-titulo text-2xl font-bold">
          Próximos eventos de {artista.stageName}
        </h2>
        <div className="mt-4">
          {consultaEventos.isPending ? (
            <Cargando etiqueta="Cargando eventos del artista" lineas={3} />
          ) : consultaEventos.error ? (
            <EstadoError
              mensaje={mensajeError(consultaEventos.error)}
              onReintentar={() => void consultaEventos.refetch()}
            />
          ) : !consultaEventos.data || consultaEventos.data.length === 0 ? (
            <EstadoVacio mensaje="Sin eventos próximos" />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {consultaEventos.data.map((evento) => (
                <Tarjeta key={evento.eventCode} className="h-full">
                  <Link
                    to={RUTAS.evento(evento.eventCode)}
                    className="flex h-full flex-col gap-3 rounded-xl p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
                  >
                    <span className="w-fit rounded-full bg-marca-50 px-2.5 py-1 text-xs font-semibold text-marca-700 dark:bg-slate-800 dark:text-marca-500">
                      {ETIQUETAS_CATEGORIA[evento.category]}
                    </span>
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
    </Contenedor>
  )
}

export default function DetalleArtista() {
  const { id } = useParams()
  const validado = EsquemaId.safeParse(id)
  if (!validado.success) return <NoEncontrada />
  return <ContenidoArtista id={validado.data} />
}

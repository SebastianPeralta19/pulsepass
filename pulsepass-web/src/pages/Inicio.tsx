import { Link } from 'react-router'
import Badge from '../componentes/Badge'
import Boton from '../componentes/Boton'
import Cargando from '../componentes/Cargando'
import EstadoError from '../componentes/EstadoError'
import EstadoVacio from '../componentes/EstadoVacio'
import Tarjeta from '../componentes/Tarjeta'
import { IconoCalendario, IconoUbicacion } from '../componentes/Iconos'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import { useEventosPublicados } from '../funcionalidades/eventos/hooks'
import type { EventCategory } from '../funcionalidades/eventos/tipos'
import { Contenedor } from '../layouts/Layout'
import { formatearFecha } from '../lib/formato'
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
  return error instanceof Error ? error.message : 'No pudimos cargar los eventos.'
}

export default function Inicio() {
  const { sesion } = useAuth()
  const consulta = useEventosPublicados()
  const autenticado = sesion.estado === 'autenticado'
  const eventos = consulta.data?.slice(0, 4) ?? []

  return (
    <>
      <div className="bg-slate-50 dark:bg-slate-950">
        <Contenedor className="py-6">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-marca-600 via-marca-500 to-acento-500 px-6 py-12 text-white shadow-xl sm:px-10 sm:py-16">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/10"
            />
            <div className="relative max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                Tu próxima experiencia empieza aquí
              </p>
              <h1 className="mt-4 font-titulo text-4xl font-bold leading-tight sm:text-5xl">
                Descubre los mejores eventos
              </h1>
              <p className="mt-4 text-lg text-white/90">
                Música, cultura, deporte y tecnología en un solo lugar.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={RUTAS.eventos}>
                  <Boton
                    variante="secundario"
                    className="border-transparent bg-white text-marca-700 hover:bg-slate-100"
                  >
                    Ver cartelera
                  </Boton>
                </Link>
                {!autenticado ? (
                  <Link to={RUTAS.registro}>
                    <Boton className="bg-white text-marca-700 hover:bg-slate-100">
                      Crear cuenta
                    </Boton>
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        </Contenedor>
      </div>

      <Contenedor>
        <section aria-labelledby="proximos-eventos">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 id="proximos-eventos" className="font-titulo text-2xl font-bold sm:text-3xl">
              Próximos eventos
            </h2>
            <Link
              to={RUTAS.eventos}
              className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
            >
              Ver todos <span aria-hidden="true">→</span>
            </Link>
          </div>

          {consulta.isPending ? (
            <Cargando etiqueta="Cargando próximos eventos" lineas={4} />
          ) : consulta.error ? (
            <EstadoError
              mensaje={mensajeError(consulta.error)}
              onReintentar={() => void consulta.refetch()}
            />
          ) : eventos.length === 0 ? (
            <EstadoVacio mensaje="Aún no hay eventos publicados" />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {eventos.map((evento) => (
                <Tarjeta key={evento.eventCode} className="h-full transition-shadow hover:shadow-md">
                  <Link
                    to={RUTAS.evento(evento.eventCode)}
                    className="flex h-full flex-col gap-3 rounded-xl p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-marca-50 px-2.5 py-1 text-xs font-semibold text-marca-700 dark:bg-slate-800 dark:text-marca-500">
                        {ETIQUETAS_CATEGORIA[evento.category]}
                      </span>
                      <Badge estado={evento.status} />
                    </div>
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
        </section>
      </Contenedor>
    </>
  )
}

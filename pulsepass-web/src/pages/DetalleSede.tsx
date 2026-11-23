import { Link, useParams } from 'react-router'
import clsx from 'clsx'
import Cargando from '../componentes/Cargando'
import EstadoError from '../componentes/EstadoError'
import Tarjeta from '../componentes/Tarjeta'
import { CodigoTexto } from '../componentes/CodigoTexto'
import { IconoFlechaIzquierda, IconoUbicacion } from '../componentes/Iconos'
import { useSede } from '../funcionalidades/sedes/hooks'
import { Contenedor } from '../layouts/Layout'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'
import NoEncontrada from './NoEncontrada'

const CLASES_ACTIVO: Record<string, string> = {
  true: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  false: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos cargar la sede.'
}

export default function DetalleSede() {
  const { code } = useParams()
  const consulta = useSede(code ?? '')
  const sede = consulta.data

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
        <Cargando etiqueta="Cargando sede" lineas={4} />
      </Contenedor>
    )
  }

  if (!sede) return <NoEncontrada />

  return (
    <Contenedor>
      <Link
        to={RUTAS.sedes}
        className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
      >
        <IconoFlechaIzquierda className="h-4 w-4" />
        Sedes
      </Link>

      <Tarjeta className="mt-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
            {sede.name}
          </h1>
          <span
            className={clsx(
              'rounded-full px-2.5 py-1 text-xs font-semibold',
              CLASES_ACTIVO[String(sede.active)] ?? CLASES_ACTIVO['false'],
            )}
          >
            {sede.active ? 'Activa' : 'Inactiva'}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Código: <CodigoTexto>{sede.code}</CodigoTexto>
        </p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Ciudad
            </dt>
            <dd className="mt-1 flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
              <IconoUbicacion className="h-4 w-4 shrink-0" />
              {sede.city}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Capacidad
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              {sede.capacity} personas
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Dirección
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              {sede.address ?? 'Dirección no disponible'}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Estado
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              {sede.active ? 'Activa' : 'Inactiva'}
            </dd>
          </div>
        </dl>
      </Tarjeta>
    </Contenedor>
  )
}

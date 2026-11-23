import { Link } from 'react-router'
import clsx from 'clsx'
import Cargando from '../componentes/Cargando'
import EstadoError from '../componentes/EstadoError'
import EstadoVacio from '../componentes/EstadoVacio'
import Tarjeta from '../componentes/Tarjeta'
import { CodigoTexto } from '../componentes/CodigoTexto'
import { IconoUbicacion } from '../componentes/Iconos'
import { useSedesActivas } from '../funcionalidades/sedes/hooks'
import { Contenedor } from '../layouts/Layout'
import { RUTAS } from '../lib/rutas'

const CLASES_ACTIVO: Record<string, string> = {
  true: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  false: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos cargar las sedes.'
}

export default function ListaSedes() {
  const consulta = useSedesActivas()
  const sedes = consulta.data ?? []

  return (
    <Contenedor>
      <h1 className="font-titulo text-3xl font-bold sm:text-4xl">Sedes</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Descubre los escenarios donde cobran vida tus eventos favoritos.
      </p>

      <div className="mt-8">
        {consulta.isPending ? (
          <Cargando etiqueta="Cargando sedes" lineas={4} />
        ) : consulta.error ? (
          <EstadoError
            mensaje={mensajeError(consulta.error)}
            onReintentar={() => void consulta.refetch()}
          />
        ) : sedes.length === 0 ? (
          <EstadoVacio mensaje="Aún no hay sedes activas" />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sedes.map((sede) => (
              <Tarjeta key={sede.code} className="h-full transition-shadow hover:shadow-md">
                <Link
                  to={RUTAS.sede(sede.code)}
                  className="flex h-full flex-col gap-3 rounded-xl p-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
                >
                  <h2 className="font-titulo text-xl font-bold text-slate-900 dark:text-slate-100">
                    {sede.name}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Código: <CodigoTexto>{sede.code}</CodigoTexto>
                  </p>
                  <dl className="mt-auto space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <IconoUbicacion className="h-4 w-4 shrink-0" />
                      <dt className="sr-only">Ciudad</dt>
                      <dd>{sede.city}</dd>
                    </div>
                    {sede.address ? (
                      <div>
                        <dt className="font-semibold text-slate-800 dark:text-slate-200">
                          Dirección
                        </dt>
                        <dd>{sede.address}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="font-semibold text-slate-800 dark:text-slate-200">
                        Capacidad
                      </dt>
                      <dd>{sede.capacity} personas</dd>
                    </div>
                  </dl>
                  <span
                    className={clsx(
                      'mt-2 w-fit rounded-full px-2.5 py-1 text-xs font-semibold',
                      CLASES_ACTIVO[String(sede.active)] ?? CLASES_ACTIVO['false'],
                    )}
                  >
                    {sede.active ? 'Activa' : 'Inactiva'}
                  </span>
                </Link>
              </Tarjeta>
            ))}
          </div>
        )}
      </div>
    </Contenedor>
  )
}

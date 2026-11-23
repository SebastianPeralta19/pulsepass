import { Link } from 'react-router'
import Aviso from '../componentes/Aviso'
import { CodigoTexto } from '../componentes/CodigoTexto'
import EstadoVacio from '../componentes/EstadoVacio'
import { IconoFlechaDerecha, IconoPlus } from '../componentes/Iconos'
import { useCreados } from '../funcionalidades/eventos/CreadosContext'
import { Contenedor } from '../layouts/Layout'
import { RUTAS } from '../lib/rutas'

export default function AdminEventos() {
  const { codigos } = useCreados()

  return (
    <Contenedor>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Administración de eventos
        </h1>
        <Link to={RUTAS.adminCrearEvento}>
          <BotonNuevoEvento />
        </Link>
      </div>

      <Aviso
        tipo="info"
        mensaje="GAP-01: la API no ofrece un listado completo de eventos. Este listado solo incluye los códigos creados en esta sesión y se pierde al recargar."
        className="mt-6"
      />

      <section className="mt-8" aria-labelledby="creados-sesion">
        <h2 id="creados-sesion" className="font-titulo text-xl font-bold text-slate-900 dark:text-slate-100">
          Creados en esta sesión
        </h2>
        {codigos.length === 0 ? (
          <div className="mt-4">
            <EstadoVacio mensaje="Aún no has creado eventos en esta sesión." />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {codigos.map((codigo) => (
              <li
                key={codigo}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <CodigoTexto>{codigo}</CodigoTexto>
                <Link
                  to={RUTAS.adminGestionEvento(codigo)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
                >
                  Gestionar
                  <IconoFlechaDerecha className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Contenedor>
  )
}

function BotonNuevoEvento() {
  return (
    <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-marca-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-marca-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 dark:hover:bg-marca-700">
      <IconoPlus className="h-4 w-4" />
      Nuevo evento
    </span>
  )
}

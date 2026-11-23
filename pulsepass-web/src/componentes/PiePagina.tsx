import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'

export default function PiePagina() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 PulsePass · Caso de estudio académico</p>
        <div className="flex gap-4">
          <Link to={RUTAS.sedes} className="hover:text-marca-700 dark:hover:text-marca-500">
            Sedes
          </Link>
          <Link to={RUTAS.artistas} className="hover:text-marca-700 dark:hover:text-marca-500">
            Artistas
          </Link>
        </div>
      </div>
    </footer>
  )
}

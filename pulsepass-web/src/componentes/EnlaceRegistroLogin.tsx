import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'

export default function EnlaceRegistroLogin() {
  return (
    <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
      ¿No tienes cuenta?{' '}
      <Link to={RUTAS.registro} className="font-semibold text-marca-700 hover:underline dark:text-marca-500">
        Regístrate
      </Link>
    </p>
  )
}

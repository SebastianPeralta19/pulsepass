import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'
import Boton from '../componentes/Boton'

export default function SinPermisos() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="font-titulo text-6xl font-bold text-marca-600 dark:text-marca-500">403</p>
      <h1 className="mt-4 font-titulo text-2xl font-bold">No tienes permisos para acceder a esta sección.</h1>
      <Link to={RUTAS.inicio} className="mt-6 inline-block">
        <Boton>Volver al inicio</Boton>
      </Link>
    </div>
  )
}

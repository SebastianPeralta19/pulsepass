import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'
import Boton from '../componentes/Boton'

export default function NoEncontrada() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="font-titulo text-6xl font-bold text-marca-600 dark:text-marca-500">404</p>
      <h1 className="mt-4 font-titulo text-2xl font-bold">No encontramos esta página</h1>
      <Link to={RUTAS.inicio} className="mt-6 inline-block">
        <Boton>Volver al inicio</Boton>
      </Link>
    </div>
  )
}

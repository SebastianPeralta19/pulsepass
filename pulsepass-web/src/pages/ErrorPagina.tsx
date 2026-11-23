import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { RUTAS } from '../lib/rutas'
import Boton from '../componentes/Boton'

export default function ErrorPagina() {
  const error = useRouteError()
  let titulo = '¡Ups! Algo salió mal.'
  let mensaje = 'No pudimos cargar esta página. Inténtalo de nuevo.'

  if (isRouteErrorResponse(error)) {
    if (error.status === 403) {
      titulo = 'No tienes permisos para acceder a esta sección.'
      mensaje = 'No pudimos cargar esta página.'
    } else if (error.status === 404) {
      titulo = 'No encontramos esta página'
      mensaje = 'La página que buscas no existe.'
    }
  }

  return (
    <div role="alert" className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-titulo text-2xl font-bold text-slate-900 dark:text-slate-100">{titulo}</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">{mensaje}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Boton onClick={() => window.location.reload()}>Reintentar</Boton>
        <Link to={RUTAS.inicio}>
          <Boton variante="secundario">Volver al inicio</Boton>
        </Link>
      </div>
    </div>
  )
}

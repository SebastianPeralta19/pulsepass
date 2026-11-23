import { Navigate, Outlet, useLocation } from 'react-router'
import { RUTAS } from '../lib/rutas'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import Cargando from '../componentes/Cargando'

export default function RutaProtegida() {
  const { sesion } = useAuth()
  const location = useLocation()

  if (sesion.estado === 'cargando') return <Cargando etiqueta="Verificando sesión" />
  if (sesion.estado === 'anonimo')
    return (
      <Navigate
        to={RUTAS.login}
        replace
        state={{ desde: `${location.pathname}${location.search}` }}
      />
    )
  return <Outlet />
}

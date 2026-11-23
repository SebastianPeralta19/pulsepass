import { Navigate, Outlet, useLocation } from 'react-router'
import type { Rol } from '../funcionalidades/auth/tipos'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import { RUTAS } from '../lib/rutas'
import Cargando from '../componentes/Cargando'

export default function RutaPorRol({ roles }: { roles: Rol[] }) {
  const { sesion } = useAuth()
  const location = useLocation()

  if (sesion.estado === 'cargando') return <Cargando etiqueta="Verificando permisos" />
  if (sesion.estado === 'anonimo')
    return (
      <Navigate
        to={RUTAS.login}
        replace
        state={{ desde: `${location.pathname}${location.search}` }}
      />
    )
  if (!roles.some((rol) => sesion.usuario.roles.includes(rol)))
    return <Navigate to={RUTAS.sinPermisos} replace />
  return <Outlet />
}

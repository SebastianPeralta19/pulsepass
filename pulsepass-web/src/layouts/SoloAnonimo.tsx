import { Navigate } from 'react-router'
import type { ReactNode } from 'react'
import { RUTAS } from '../lib/rutas'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import Cargando from '../componentes/Cargando'

export default function SoloAnonimo({ children }: { children: ReactNode }) {
  const { sesion } = useAuth()

  if (sesion.estado === 'cargando') return <Cargando etiqueta="Verificando sesión" />
  if (sesion.estado === 'autenticado') return <Navigate to={RUTAS.inicio} replace />
  return <>{children}</>
}

import { Component } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'

export function es403(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403
}

export function mensajeErrorAdminEvento(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return Object.values(error.details).join(' ') || error.message || 'Revisa los datos.'
    }
    if (error.status === 409) return error.message
    if (error.status === 0) return 'No pudimos conectar con el servidor.'
    if (error.status >= 500) return 'Ocurrió un error inesperado. Inténtalo más tarde.'
    return error.message
  }
  return 'Ocurrió un error inesperado. Inténtalo más tarde.'
}

export class LimiteErrorAdminEvento extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (es403(error)) return <Navigate to={RUTAS.sinPermisos} replace />
    throw error
  }
}

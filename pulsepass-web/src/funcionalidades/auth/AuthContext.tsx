import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { Rol, Sesion } from './tipos'

export interface AuthContextValue {
  sesion: Sesion
  iniciarSesion: (identifier: string, password: string) => Promise<void>
  cerrarSesion: (motivo?: 'expirada') => void
  tieneRol: (...roles: Rol[]) => boolean
  registrarNavegador: (navegar: (ruta: string, opciones?: unknown) => void) => void
  sesionExpirada: boolean
}

const valorPorDefecto: AuthContextValue = {
  sesion: { estado: 'anonimo' },
  iniciarSesion: async () => undefined,
  cerrarSesion: () => undefined,
  tieneRol: () => false,
  registrarNavegador: () => undefined,
  sesionExpirada: false,
}

export const AuthContext = createContext<AuthContextValue>(valorPorDefecto)

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={valorPorDefecto}>{children}</AuthContext.Provider>
}

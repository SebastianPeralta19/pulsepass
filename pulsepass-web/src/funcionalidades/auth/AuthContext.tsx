import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { NavigateFunction } from 'react-router'
import { limpiarToken, guardarToken, obtenerToken, registrarManejador401 } from '../../lib/http'
import { queryClient } from '../../lib/queryClient'
import { RUTAS } from '../../lib/rutas'
import * as api from './api'
import { TokenGuardadoSchema } from './tipos'
import type { Rol, Sesion, TokenGuardado } from './tipos'

const CLAVE_TOKEN = 'pulsepass.token'

export interface AuthContextValue {
  sesion: Sesion
  iniciarSesion: (identifier: string, password: string) => Promise<void>
  cerrarSesion: (motivo?: 'expirada') => void
  tieneRol: (...roles: Rol[]) => boolean
  registrarNavegador: (navegar: NavigateFunction | null) => void
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

function leerTokenGuardado(): TokenGuardado | null {
  const token = obtenerToken()
  if (!token) return null
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_TOKEN)
    if (!crudo) return null
    const validado = TokenGuardadoSchema.safeParse(JSON.parse(crudo) as unknown)
    if (!validado.success) {
      limpiarToken()
      return null
    }
    if (validado.data.token !== token || validado.data.expiraEn <= Date.now()) {
      limpiarToken()
      return null
    }
    return validado.data
  } catch {
    limpiarToken()
    return null
  }
}

function rutaActual(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion>({ estado: 'cargando' })
  const [sesionExpirada, setSesionExpirada] = useState(false)
  const navegadorRef = useRef<NavigateFunction | null>(null)
  const intentoLoginRef = useRef(false)

  const registrarNavegador = useCallback((navegar: NavigateFunction | null) => {
    navegadorRef.current = navegar
  }, [])

  const cerrarSesion = useCallback((motivo?: 'expirada') => {
    limpiarToken()
    void queryClient.clear()
    setSesion({ estado: 'anonimo' })
    setSesionExpirada(motivo === 'expirada')
    const navegar = navegadorRef.current
    if (!navegar) return
    if (motivo === 'expirada') {
      navegar(RUTAS.login, {
        state: { motivo: 'expirada', desde: rutaActual() },
      })
      return
    }
    navegar(RUTAS.inicio)
  }, [])

  const iniciarSesion = useCallback(async (identifier: string, password: string) => {
    intentoLoginRef.current = true
    const respuesta = await api.login({ identifier, password }).finally(() => {
      intentoLoginRef.current = false
    })
    const expiraEn = Date.now() + respuesta.expiresIn * 1000
    guardarToken(respuesta.accessToken, expiraEn)
    const usuario = await api.obtenerPerfil()
    setSesion({
      estado: 'autenticado',
      token: respuesta.accessToken,
      expiraEn,
      usuario,
    })
    setSesionExpirada(false)
  }, [])

  const tieneRol = useCallback(
    (...roles: Rol[]) =>
      sesion.estado === 'autenticado' && roles.some((rol) => sesion.usuario.roles.includes(rol)),
    [sesion],
  )

  useEffect(() => {
    registrarManejador401(() => {
      if (intentoLoginRef.current) return
      cerrarSesion('expirada')
    })
    return () => registrarManejador401(null)
  }, [cerrarSesion])

  useEffect(() => {
    let activo = true
    const guardado = leerTokenGuardado()
    if (!guardado) {
      void Promise.resolve().then(() => {
        if (activo) setSesion({ estado: 'anonimo' })
      })
      return () => {
        activo = false
      }
    }
    api.obtenerPerfil()
      .then((usuario) => {
        if (!activo) return
        setSesion({
          estado: 'autenticado',
          token: guardado.token,
          expiraEn: guardado.expiraEn,
          usuario,
        })
      })
      .catch(() => {
        if (!activo) return
        limpiarToken()
        setSesion({ estado: 'anonimo' })
      })
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    if (sesion.estado !== 'autenticado') return
    const restante = Math.max(0, sesion.expiraEn - Date.now())
    const temporizador = window.setTimeout(() => cerrarSesion('expirada'), restante)
    return () => window.clearTimeout(temporizador)
  }, [sesion, cerrarSesion])

  const valor = useMemo(
    () => ({
      sesion,
      iniciarSesion,
      cerrarSesion,
      tieneRol,
      registrarNavegador,
      sesionExpirada,
    }),
    [sesion, iniciarSesion, cerrarSesion, tieneRol, registrarNavegador, sesionExpirada],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

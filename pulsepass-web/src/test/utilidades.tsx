import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthContext } from '../funcionalidades/auth/AuthContext'
import type { AuthContextValue } from '../funcionalidades/auth/AuthContext'
import { CreadosProvider } from '../funcionalidades/eventos/CreadosContext'
import type { Rol, Sesion } from '../funcionalidades/auth/tipos'

export function sesionAutenticada(roles: Rol[] = ['USER']): Sesion {
  return {
    estado: 'autenticado',
    token: 'token-de-prueba',
    expiraEn: Date.now() + 900_000,
    usuario: {
      id: 1,
      username: 'carlos',
      email: 'carlos@example.com',
      active: true,
      roles,
    },
  }
}

export function crearAuthMock(
  sesion: Sesion = { estado: 'anonimo' },
  sobreescrituras: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    sesion,
    iniciarSesion: vi.fn(async () => undefined),
    cerrarSesion: vi.fn(),
    tieneRol: (...roles: Rol[]) =>
      sesion.estado === 'autenticado' && roles.some((rol) => sesion.usuario.roles.includes(rol)),
    registrarNavegador: vi.fn(),
    sesionExpirada: false,
    ...sobreescrituras,
  }
}

export function renderConProveedores(
  ui: ReactElement,
  opciones: {
    ruta?: string
    rutaPatron?: string
    sesion?: Sesion
    auth?: AuthContextValue
  } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const contenido = opciones.rutaPatron ? (
    <Routes>
      <Route path={opciones.rutaPatron} element={ui} />
    </Routes>
  ) : (
    ui
  )
  const resultado = render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={opciones.auth ?? crearAuthMock(opciones.sesion)}>
        <CreadosProvider>
          <MemoryRouter initialEntries={[opciones.ruta ?? '/']}>{contenido}</MemoryRouter>
        </CreadosProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
  return { ...resultado, queryClient }
}

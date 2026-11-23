import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http as mswHttp, HttpResponse } from 'msw'
import type { ReactElement } from 'react'
import { AuthProvider, useAuth } from '../funcionalidades/auth/AuthContext'
import { guardarToken, limpiarToken, obtenerToken, registrarManejador401 } from '../lib/http'
import { queryClient } from '../lib/queryClient'
import RutaPorRol from '../layouts/RutaPorRol'
import RutaProtegida from '../layouts/RutaProtegida'
import Login from '../pages/Login'
import Registro from '../pages/Registro'
import { authResponse, usuarioAutenticado, usuarioPerfil } from './fixtures'
import { cuerpoError, respuestaError } from './handlers'
import { servidor } from './servidor'
import { crearAuthMock, renderConProveedores, sesionAutenticada } from './utilidades'

const BASE = 'http://localhost/api'

function MonitorSesion() {
  const { sesion } = useAuth()
  const ubicacion = useLocation()
  const desde = (ubicacion.state as { desde?: string } | null)?.desde ?? ''
  return (
    <div>
      <span data-testid="ruta">{ubicacion.pathname}</span>
      <span data-testid="estado-sesion">{sesion.estado}</span>
      <span data-testid="desde">{desde}</span>
      {sesion.estado === 'autenticado' ? (
        <span data-testid="usuario">{sesion.usuario.username}</span>
      ) : null}
    </div>
  )
}

function PanelCerrarSesion() {
  const { sesion, cerrarSesion } = useAuth()
  return (
    <div>
      <span data-testid="estado-sesion">{sesion.estado}</span>
      <button type="button" onClick={() => cerrarSesion()}>
        Cerrar sesión
      </button>
    </div>
  )
}

function renderConAuthReal(
  ui: ReactElement,
  opciones: { ruta?: string; estado?: { desde?: string } } = {},
) {
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const entrada = opciones.estado
    ? { pathname: opciones.ruta ?? '/', state: opciones.estado }
    : (opciones.ruta ?? '/')
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[entrada]}>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function completarLogin(identifier: string) {
  const usuarioEvent = userEvent.setup()
  await usuarioEvent.type(screen.getByLabelText('Usuario o correo'), identifier)
  await usuarioEvent.type(screen.getByLabelText('Contraseña'), 'contrasena-segura')
  await usuarioEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
}

async function completarRegistro(contrasena = 'ContrasenaSegura123') {
  const usuarioEvent = userEvent.setup()
  await usuarioEvent.type(screen.getByLabelText('Nombre de usuario'), 'andrea')
  await usuarioEvent.type(screen.getByLabelText('Correo electrónico'), 'andrea@example.com')
  await usuarioEvent.type(screen.getByLabelText('Nombres'), 'Andrea')
  await usuarioEvent.type(screen.getByLabelText('Apellidos'), 'Pérez')
  fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), {
    target: { value: '1998-04-12' },
  })
  await usuarioEvent.type(screen.getByLabelText('Contraseña (mín. 12)'), contrasena)
  await usuarioEvent.type(screen.getByLabelText('Confirmar contraseña'), contrasena)
  await usuarioEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
}

afterEach(() => {
  cleanup()
  limpiarToken()
  registrarManejador401(null)
  sessionStorage.clear()
})

describe('TEST-FE-AUTH', () => {
  it('TEST-FE-AUTH-001: login válido → sesión autenticada y redirección a desde', async () => {
    renderConAuthReal(
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/eventos" element={<MonitorSesion />} />
      </Routes>,
      { ruta: '/login', estado: { desde: '/eventos' } },
    )

    await completarLogin('andrea')

    expect(await screen.findByTestId('ruta')).toHaveTextContent('/eventos')
    expect(screen.getByTestId('estado-sesion')).toHaveTextContent('autenticado')
    expect(screen.getByTestId('usuario')).toHaveTextContent('andrea')
    expect(screen.queryByRole('button', { name: 'Ingresar' })).not.toBeInTheDocument()
  })

  it('TEST-FE-AUTH-002: login 401 → "Credenciales inválidas"', async () => {
    servidor.use(
      mswHttp.post(`${BASE}/auth/login`, () =>
        HttpResponse.json(cuerpoError(401, 'Bad credentials'), { status: 401 }),
      ),
    )
    renderConAuthReal(
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>,
      { ruta: '/login' },
    )

    await completarLogin('miguel')

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
    expect(screen.queryByText('Bad credentials')).not.toBeInTheDocument()
  })

  it('TEST-FE-AUTH-003: login sin campos → errores y 0 peticiones', async () => {
    let peticiones = 0
    servidor.use(
      mswHttp.post(`${BASE}/auth/login`, () => {
        peticiones += 1
        return HttpResponse.json(authResponse)
      }),
    )
    const auth = crearAuthMock()
    renderConProveedores(<Login />, { auth })

    const usuarioEvent = userEvent.setup()
    await usuarioEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Ingresa tu usuario o correo')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu contraseña')).toBeInTheDocument()
    expect(peticiones).toBe(0)
    expect(auth.iniciarSesion).not.toHaveBeenCalled()
  })

  it('TEST-FE-AUTH-004: registro con contraseña corta → error y 0 peticiones', async () => {
    let peticiones = 0
    servidor.use(
      mswHttp.post(`${BASE}/users`, () => {
        peticiones += 1
        return HttpResponse.json(usuarioPerfil, { status: 201 })
      }),
    )
    renderConProveedores(<Registro />)

    await completarRegistro('corta')

    expect(
      await screen.findByText('La contraseña debe tener al menos 12 caracteres'),
    ).toBeInTheDocument()
    expect(peticiones).toBe(0)
  })

  it('TEST-FE-AUTH-005: registro 201 → redirección a /login', async () => {
    renderConProveedores(
      <Routes>
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<div data-testid="destino-login">Inicia sesión</div>} />
      </Routes>,
      { ruta: '/registro' },
    )

    await completarRegistro()

    expect(await screen.findByTestId('destino-login')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Crea tu cuenta' })).not.toBeInTheDocument()
  })

  it('TEST-FE-AUTH-006: registro 409 → mensaje genérico visible', async () => {
    servidor.use(
      mswHttp.post(`${BASE}/users`, () => respuestaError(409, 'Username already exists')),
    )
    renderConProveedores(<Registro />)

    await completarRegistro()

    expect(
      await screen.findByText('El usuario o correo ya está registrado'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Username already exists')).not.toBeInTheDocument()
  })

  it('TEST-FE-AUTH-007: RutaProtegida anónimo → /login con state.desde', async () => {
    renderConProveedores(
      <Routes>
        <Route element={<RutaProtegida />}>
          <Route path="/mis-tickets" element={<div>Contenido privado</div>} />
        </Route>
        <Route path="/login" element={<MonitorSesion />} />
      </Routes>,
      { ruta: '/mis-tickets?filtro=PAID' },
    )

    expect(await screen.findByTestId('ruta')).toHaveTextContent('/login')
    expect(screen.getByTestId('desde')).toHaveTextContent('/mis-tickets?filtro=PAID')
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })

  it('TEST-FE-AUTH-008: RutaPorRol USER en /admin → /403', async () => {
    renderConProveedores(
      <Routes>
        <Route element={<RutaPorRol roles={['ADMIN']} />}>
          <Route path="/admin/eventos" element={<div data-testid="panel-admin">Panel admin</div>} />
        </Route>
        <Route path="/403" element={<div data-testid="sin-permisos">Sin permisos</div>} />
      </Routes>,
      { ruta: '/admin/eventos', sesion: sesionAutenticada(['USER']) },
    )

    expect(await screen.findByTestId('sin-permisos')).toBeInTheDocument()
    expect(screen.queryByTestId('panel-admin')).not.toBeInTheDocument()
  })

  it('TEST-FE-AUTH-009: RutaPorRol ADMIN en /admin → renderiza contenido', async () => {
    renderConProveedores(
      <Routes>
        <Route element={<RutaPorRol roles={['ADMIN']} />}>
          <Route path="/admin/eventos" element={<div data-testid="panel-admin">Panel admin</div>} />
        </Route>
        <Route path="/403" element={<div data-testid="sin-permisos">Sin permisos</div>} />
      </Routes>,
      { ruta: '/admin/eventos', sesion: sesionAutenticada(['ADMIN']) },
    )

    expect(await screen.findByTestId('panel-admin')).toBeInTheDocument()
    expect(screen.queryByTestId('sin-permisos')).not.toBeInTheDocument()
  })

  it('TEST-FE-AUTH-010: cerrar sesión limpia token y caché', async () => {
    guardarToken('token-sesion', Date.now() + 900_000)
    const limpiarCache = vi.spyOn(queryClient, 'clear')
    renderConAuthReal(<PanelCerrarSesion />)

    expect(await screen.findByTestId('estado-sesion')).toHaveTextContent('autenticado')
    expect(sessionStorage.getItem('pulsepass.token')).not.toBeNull()

    const usuarioEvent = userEvent.setup()
    await usuarioEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    await waitFor(() => {
      expect(screen.getByTestId('estado-sesion')).toHaveTextContent('anonimo')
    })
    expect(sessionStorage.getItem('pulsepass.token')).toBeNull()
    expect(obtenerToken()).toBeNull()
    expect(limpiarCache).toHaveBeenCalled()
  })

  it('TEST-FE-AUTH-011: token expirado al restaurar → anónimo y token eliminado', async () => {
    limpiarToken()
    sessionStorage.setItem(
      'pulsepass.token',
      JSON.stringify({ token: 'token-expirado', expiraEn: Date.now() - 1000 }),
    )
    let peticionesPerfil = 0
    servidor.use(
      mswHttp.get(`${BASE}/auth/me`, () => {
        peticionesPerfil += 1
        return HttpResponse.json(usuarioAutenticado)
      }),
    )
    renderConAuthReal(<PanelCerrarSesion />)

    await waitFor(() => {
      expect(screen.getByTestId('estado-sesion')).toHaveTextContent('anonimo')
    })
    expect(sessionStorage.getItem('pulsepass.token')).toBeNull()
    expect(obtenerToken()).toBeNull()
    expect(peticionesPerfil).toBe(0)
  })
})

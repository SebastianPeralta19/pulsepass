import { afterEach, describe, expect, it, vi } from 'vitest'
import { http as mswHttp, HttpResponse } from 'msw'
import { render, screen } from '@testing-library/react'
import PrecioCOP from '../componentes/PrecioCOP'
import { obtenerPerfil } from '../funcionalidades/auth/api'
import { ApiError, limpiarToken, guardarToken, registrarManejador401 } from '../lib/http'
import { servidor } from './servidor'
import { cuerpoError } from './handlers'

const BASE = 'http://localhost/api'

afterEach(() => {
  limpiarToken()
  registrarManejador401(null)
})

describe('TEST-FE-LIB', () => {
  it('TEST-FE-LIB-001: añade Authorization Bearer cuando hay sesión', async () => {
    guardarToken('token-de-prueba', Date.now() + 60_000)
    let autorizacion = ''
    servidor.use(
      mswHttp.get(`${BASE}/auth/me`, ({ request }) => {
        autorizacion = request.headers.get('Authorization') ?? ''
        return HttpResponse.json({
          id: 1,
          username: 'andrea',
          email: 'andrea@example.com',
          active: true,
          roles: ['USER'],
        })
      }),
    )
    await obtenerPerfil()
    expect(autorizacion).toBe('Bearer token-de-prueba')
  })

  it('TEST-FE-LIB-002: ErrorResponse válido → ApiError con status y details', async () => {
    servidor.use(
      mswHttp.get(`${BASE}/auth/me`, () =>
        HttpResponse.json(
          cuerpoError(400, 'Datos inválidos', { username: 'Ya existe' }),
          { status: 400 },
        ),
      ),
    )
    await expect(obtenerPerfil()).rejects.toMatchObject({
      status: 400,
      message: 'Datos inválidos',
      details: { username: 'Ya existe' },
    })
  })

  it('TEST-FE-LIB-003: cuerpo de error inválido → ApiError genérico', async () => {
    servidor.use(
      mswHttp.get(`${BASE}/auth/me`, () =>
        HttpResponse.json({ inesperado: true }, { status: 500 }),
      ),
    )
    await expect(obtenerPerfil()).rejects.toThrow(
      'Ocurrió un error inesperado. Inténtalo más tarde.',
    )
  })

  it('TEST-FE-LIB-004: 401 dispara cierre de sesión', async () => {
    const alCerrar = vi.fn()
    registrarManejador401(alCerrar)
    servidor.use(
      mswHttp.get(`${BASE}/auth/me`, () =>
        HttpResponse.json(cuerpoError(401, 'Unauthorized'), { status: 401 }),
      ),
    )
    await expect(obtenerPerfil()).rejects.toBeInstanceOf(ApiError)
    expect(alCerrar).toHaveBeenCalledOnce()
  })

  it('TEST-FE-LIB-005: PrecioCOP formatea 250000 como COP', () => {
    render(<PrecioCOP valor={250000} />)
    expect(screen.getByText(/250\.000/)).toBeInTheDocument()
  })
})

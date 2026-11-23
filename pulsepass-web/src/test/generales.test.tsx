import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, Route, RouterProvider, Routes } from 'react-router'
import Layout from '../layouts/Layout'
import ErrorPagina from '../pages/ErrorPagina'
import NoEncontrada from '../pages/NoEncontrada'
import { renderConProveedores, sesionAutenticada } from './utilidades'

afterEach(() => {
  cleanup()
})

describe('TEST-FE-GEN', () => {
  it('TEST-FE-GEN-001: ruta inexistente → contenido 404', async () => {
    renderConProveedores(
      <Routes>
        <Route path="/" element={<div>Inicio</div>} />
        <Route path="*" element={<NoEncontrada />} />
      </Routes>,
      { ruta: '/esta-ruta-no-existe' },
    )

    expect(await screen.findByText('404')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'No encontramos esta página' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver al inicio' })).toBeInTheDocument()
  })

  it('TEST-FE-GEN-002: errorElement muestra mensaje seguro sin stack', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <div>Contenido</div>,
          errorElement: <ErrorPagina />,
          loader: () => {
            throw new Error('Fallo interno con datos sensibles')
          },
        },
      ],
      { initialEntries: ['/'] },
    )
    render(<RouterProvider router={router} />)

    const alerta = await screen.findByRole('alert')
    await waitFor(() => {
      expect(alerta).toHaveTextContent('No pudimos cargar esta página. Inténtalo de nuevo.')
    })
    expect(alerta).not.toHaveTextContent('Fallo interno con datos sensibles')
    expect(alerta.textContent).not.toContain(' at ')
    expect(alerta.textContent).not.toContain('.ts:')
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toBeInTheDocument()
  })

  it('TEST-FE-GEN-003: navbar muestra enlaces según rol', () => {
    const anonimo = renderConProveedores(<Layout />, { ruta: '/' })
    const navAnonimo = within(anonimo.container).getByRole('navigation', { name: 'Principal' })
    expect(within(navAnonimo).getByRole('link', { name: 'Ingresar' })).toBeInTheDocument()
    expect(within(navAnonimo).getByRole('link', { name: 'Registrarse' })).toBeInTheDocument()
    expect(within(navAnonimo).queryByRole('link', { name: 'Mis tickets' })).not.toBeInTheDocument()
    expect(
      within(navAnonimo).queryByRole('link', { name: 'Administrar eventos' }),
    ).not.toBeInTheDocument()
    expect(
      within(navAnonimo).queryByRole('link', { name: 'Validar ingreso' }),
    ).not.toBeInTheDocument()

    const usuario = renderConProveedores(<Layout />, {
      sesion: sesionAutenticada(['USER']),
    })
    const navUsuario = within(usuario.container).getByRole('navigation', { name: 'Principal' })
    expect(within(navUsuario).getByRole('link', { name: 'Mis tickets' })).toBeInTheDocument()
    expect(within(navUsuario).getByRole('button', { name: /carlos/ })).toBeInTheDocument()
    expect(
      within(navUsuario).queryByRole('link', { name: 'Administrar eventos' }),
    ).not.toBeInTheDocument()
    expect(
      within(navUsuario).queryByRole('link', { name: 'Validar ingreso' }),
    ).not.toBeInTheDocument()

    const administrador = renderConProveedores(<Layout />, {
      sesion: sesionAutenticada(['ADMIN']),
    })
    const navAdmin = within(administrador.container).getByRole('navigation', { name: 'Principal' })
    expect(within(navAdmin).getByRole('link', { name: 'Administrar eventos' })).toBeInTheDocument()
    expect(within(navAdmin).getByRole('link', { name: 'Validar ingreso' })).toBeInTheDocument()
    expect(within(navAdmin).queryByRole('link', { name: 'Mis tickets' })).not.toBeInTheDocument()
  })

  it('TEST-FE-GEN-004: menú móvil abre y cierra con Escape', async () => {
    renderConProveedores(<Layout />, { ruta: '/' })
    const usuarioEvent = userEvent.setup()
    const boton = screen.getByRole('button', { name: 'Abrir menú' })
    expect(boton).toHaveAttribute('aria-expanded', 'false')

    await usuarioEvent.click(boton)

    expect(boton).toHaveAttribute('aria-expanded', 'true')
    expect(boton).toHaveAttribute('aria-label', 'Cerrar menú')
    const menu = document.getElementById('menu-movil')
    expect(menu).not.toBeNull()
    const primerEnlace = within(menu as HTMLElement).getByRole('link', { name: 'Inicio' })
    await waitFor(() => {
      expect(primerEnlace).toHaveFocus()
    })

    await usuarioEvent.keyboard('{Escape}')

    expect(document.getElementById('menu-movil')).toBeNull()
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    expect(boton).toHaveFocus()
  })

  it('TEST-FE-GEN-005: Tab alcanza el enlace Saltar al contenido', async () => {
    renderConProveedores(<Layout />, { ruta: '/' })
    const usuarioEvent = userEvent.setup()

    await usuarioEvent.tab()

    const saltar = screen.getByRole('link', { name: 'Saltar al contenido' })
    expect(saltar).toHaveFocus()
    expect(saltar).toHaveAttribute('href', '#contenido')
    expect(saltar.className).toContain('focus:not-sr-only')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'contenido')
  })
})

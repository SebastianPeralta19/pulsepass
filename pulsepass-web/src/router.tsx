import type { JSX } from 'react'
import { createBrowserRouter, Outlet } from 'react-router'
import Layout from './layouts/Layout'
import Inicio from './pages/Inicio'
import ErrorPagina from './pages/ErrorPagina'
import RutaProtegida from './layouts/RutaProtegida'
import RutaPorRol from './layouts/RutaPorRol'
import SoloAnonimo from './layouts/SoloAnonimo'

function pagina(modulo: () => Promise<{ default: () => JSX.Element }>) {
  return async () => {
    const { default: Component } = await modulo()
    return { Component }
  }
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPagina />,
    children: [
      { index: true, element: <Inicio /> },
      {
        children: [
          {
            path: 'eventos',
            lazy: pagina(() => import('./pages/CatalogoEventos')),
          },
          {
            path: 'eventos/:eventCode',
            lazy: pagina(() => import('./pages/DetalleEvento')),
          },
          {
            path: 'artistas',
            lazy: pagina(() => import('./pages/ListaArtistas')),
          },
          {
            path: 'artistas/:id',
            lazy: pagina(() => import('./pages/DetalleArtista')),
          },
          {
            path: 'sedes',
            lazy: pagina(() => import('./pages/ListaSedes')),
          },
          {
            path: 'sedes/:code',
            lazy: pagina(() => import('./pages/DetalleSede')),
          },
        ],
      },
      {
        path: 'login',
        element: (
          <SoloAnonimo>
            <Outlet />
          </SoloAnonimo>
        ),
        children: [
          {
            index: true,
            lazy: pagina(() => import('./pages/Login')),
          },
        ],
      },
      {
        path: 'registro',
        element: (
          <SoloAnonimo>
            <Outlet />
          </SoloAnonimo>
        ),
        children: [
          {
            index: true,
            lazy: pagina(() => import('./pages/Registro')),
          },
        ],
      },
      {
        element: <RutaProtegida />,
        children: [
          {
            path: 'cuenta',
            lazy: pagina(() => import('./pages/Cuenta')),
          },
          {
            element: <RutaPorRol roles={['USER']} />,
            children: [
              {
                path: 'mis-tickets',
                lazy: pagina(() => import('./pages/MisTickets')),
              },
              {
                path: 'mis-tickets/:ticketCode',
                lazy: pagina(() => import('./pages/DetalleTicket')),
              },
              {
                path: 'compra/confirmacion/:ticketCode',
                lazy: pagina(() => import('./pages/ConfirmacionCompra')),
              },
            ],
          },
          {
            element: <RutaPorRol roles={['STAFF', 'ADMIN']} />,
            children: [
              {
                path: 'staff/validacion',
                lazy: pagina(() => import('./pages/ValidacionIngreso')),
              },
              {
                path: 'staff/eventos/:eventCode/tickets',
                lazy: pagina(() => import('./pages/TicketsPagadosEvento')),
              },
            ],
          },
          {
            element: <RutaPorRol roles={['ADMIN']} />,
            children: [
              {
                path: 'admin/eventos',
                lazy: pagina(() => import('./pages/AdminEventos')),
              },
              {
                path: 'admin/eventos/nuevo',
                lazy: pagina(() => import('./pages/AdminCrearEvento')),
              },
              {
                path: 'admin/eventos/:eventCode',
                lazy: pagina(() => import('./pages/AdminGestionEvento')),
              },
            ],
          },
        ],
      },
      {
        path: '403',
        lazy: pagina(() => import('./pages/SinPermisos')),
      },
      {
        path: '*',
        lazy: pagina(() => import('./pages/NoEncontrada')),
      },
    ],
  },
])

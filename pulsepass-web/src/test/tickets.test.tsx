import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { http as mswHttp, HttpResponse } from 'msw'
import type { TicketResponse } from '../funcionalidades/tickets/tipos'
import ConfirmacionCompra from '../pages/ConfirmacionCompra'
import DetalleEvento from '../pages/DetalleEvento'
import DetalleTicket from '../pages/DetalleTicket'
import MisTickets from '../pages/MisTickets'
import { ticketAndrea, ticketCarlos } from './fixtures'
import { respuestaError } from './handlers'
import { servidor } from './servidor'
import { renderConProveedores, sesionAutenticada } from './utilidades'

const BASE = 'http://localhost/api'

interface CuerpoCompra {
  userEmail: string
  eventCode: string
  type: string
}

function MonitorLogin() {
  const ubicacion = useLocation()
  const desde = (ubicacion.state as { desde?: string } | null)?.desde ?? ''
  return (
    <div>
      <span data-testid="ruta">{ubicacion.pathname}</span>
      <span data-testid="desde">{desde}</span>
    </div>
  )
}

function RutasCompra() {
  return (
    <Routes>
      <Route path="/eventos/:eventCode" element={<DetalleEvento />} />
      <Route path="/compra/confirmacion/:ticketCode" element={<ConfirmacionCompra />} />
      <Route path="/login" element={<MonitorLogin />} />
    </Routes>
  )
}

function RutasTickets() {
  return (
    <Routes>
      <Route path="/mis-tickets" element={<MisTickets />} />
      <Route path="/mis-tickets/:ticketCode" element={<DetalleTicket />} />
    </Routes>
  )
}

async function abrirModalCompra() {
  const usuario = userEvent.setup()
  await usuario.click(await screen.findByRole('button', { name: 'Comprar entrada' }))
  await usuario.selectOptions(await screen.findByLabelText('Tipo de ticket'), 'VIP')
  return usuario
}

afterEach(() => {
  cleanup()
})

describe('TEST-FE-TKT', () => {
  it('TEST-FE-TKT-001: compra válida → 201 y navega a confirmación', async () => {
    let compras = 0
    servidor.use(
      mswHttp.post(`${BASE}/tickets`, () => {
        compras += 1
        return HttpResponse.json(ticketAndrea, { status: 201 })
      }),
    )
    renderConProveedores(<RutasCompra />, {
      ruta: '/eventos/CMF-2026',
      sesion: sesionAutenticada(),
    })

    const usuario = await abrirModalCompra()
    await usuario.click(screen.getByRole('button', { name: 'Confirmar compra' }))

    expect(
      await screen.findByRole('heading', { name: '¡Compra realizada con éxito!' }),
    ).toBeInTheDocument()
    expect(screen.getByText(ticketAndrea.ticketCode)).toBeInTheDocument()
    expect(compras).toBe(1)
  })

  it('TEST-FE-TKT-002: compra anónima → redirige a login', async () => {
    renderConProveedores(<RutasCompra />, { ruta: '/eventos/CMF-2026' })

    const usuario = userEvent.setup()
    await usuario.click(await screen.findByRole('button', { name: 'Comprar entrada' }))

    expect(await screen.findByTestId('ruta')).toHaveTextContent('/login')
    expect(screen.getByTestId('desde')).toHaveTextContent('/eventos/CMF-2026')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('TEST-FE-TKT-003: compra 409 → mensaje del backend en el modal', async () => {
    servidor.use(
      mswHttp.post(`${BASE}/tickets`, () =>
        respuestaError(409, 'No quedan entradas VIP para este evento'),
      ),
    )
    renderConProveedores(<RutasCompra />, {
      ruta: '/eventos/CMF-2026',
      sesion: sesionAutenticada(),
    })

    const usuario = await abrirModalCompra()
    await usuario.click(screen.getByRole('button', { name: 'Confirmar compra' }))

    const dialogo = await screen.findByRole('dialog')
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
      'No quedan entradas VIP para este evento',
    )
    expect(dialogo).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '¡Compra realizada con éxito!' })).not.toBeInTheDocument()
  })

  it('TEST-FE-TKT-004: compra envía el email de la sesión', async () => {
    let cuerpo: CuerpoCompra | null = null
    servidor.use(
      mswHttp.post(`${BASE}/tickets`, async ({ request }) => {
        cuerpo = (await request.json()) as CuerpoCompra
        return HttpResponse.json(ticketAndrea, { status: 201 })
      }),
    )
    renderConProveedores(<RutasCompra />, {
      ruta: '/eventos/CMF-2026',
      sesion: sesionAutenticada(),
    })

    const usuario = await abrirModalCompra()
    await usuario.click(screen.getByRole('button', { name: 'Confirmar compra' }))

    expect(
      await screen.findByRole('heading', { name: '¡Compra realizada con éxito!' }),
    ).toBeInTheDocument()
    expect(cuerpo).toEqual({
      userEmail: 'carlos@example.com',
      eventCode: 'CMF-2026',
      type: 'VIP',
    })
  })

  it('TEST-FE-TKT-005: mis tickets lista y filtra por estado', async () => {
    const ticketsFiltrables: TicketResponse[] = [
      ticketAndrea,
      { ...ticketCarlos, status: 'USED' },
    ]
    servidor.use(
      mswHttp.get(`${BASE}/tickets/by-user`, () => HttpResponse.json(ticketsFiltrables)),
    )
    renderConProveedores(<MisTickets />, {
      ruta: '/mis-tickets',
      sesion: sesionAutenticada(),
    })

    const tablaInicial = await screen.findByRole('table', { name: 'Tickets del usuario' })
    expect(within(tablaInicial).getByText('TKT-AND-001')).toBeInTheDocument()
    expect(within(tablaInicial).getByText('TKT-CAR-001')).toBeInTheDocument()
    expect(screen.getByText('2 tickets')).toBeInTheDocument()

    const usuario = userEvent.setup()
    await usuario.click(screen.getByRole('button', { name: 'Usados' }))

    await waitFor(() => {
      expect(screen.getByText('1 tickets')).toBeInTheDocument()
    })
    const tablaFiltrada = screen.getByRole('table', { name: 'Tickets del usuario' })
    expect(within(tablaFiltrada).getByText('TKT-CAR-001')).toBeInTheDocument()
    expect(within(tablaFiltrada).queryByText('TKT-AND-001')).not.toBeInTheDocument()
  })

  it('TEST-FE-TKT-006: mis tickets vacío', async () => {
    servidor.use(mswHttp.get(`${BASE}/tickets/by-user`, () => HttpResponse.json([])))
    renderConProveedores(<MisTickets />, {
      ruta: '/mis-tickets',
      sesion: sesionAutenticada(),
    })

    expect(await screen.findByText('Aún no tienes tickets')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('TEST-FE-TKT-007: cancelar PAID → 200 y lista actualizada', async () => {
    let cancelado = false
    servidor.use(
      mswHttp.patch(`${BASE}/tickets/:ticketCode/cancel`, () => {
        cancelado = true
        return HttpResponse.json({ ...ticketCarlos, status: 'CANCELLED' })
      }),
      mswHttp.get(`${BASE}/tickets/by-user`, () =>
        HttpResponse.json([{ ...ticketCarlos, status: cancelado ? 'CANCELLED' : 'PAID' }]),
      ),
    )
    renderConProveedores(<RutasTickets />, {
      ruta: '/mis-tickets/TKT-CAR-001',
      sesion: sesionAutenticada(),
    })

    const usuario = userEvent.setup()
    await usuario.click(await screen.findByRole('button', { name: 'Cancelar ticket' }))
    await usuario.click(screen.getByRole('button', { name: 'Confirmar cancelación' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    await usuario.click(screen.getByRole('link', { name: 'Mis tickets' }))

    const tabla = await screen.findByRole('table', { name: 'Tickets del usuario' })
    await waitFor(() => {
      expect(within(tabla).getByText('CANCELLED')).toBeInTheDocument()
      expect(within(tabla).queryByText('PAID')).not.toBeInTheDocument()
    })
  })

  it('TEST-FE-TKT-008: cancelar → 409 muestra mensaje y mantiene modal', async () => {
    servidor.use(
      mswHttp.patch(`${BASE}/tickets/:ticketCode/cancel`, () =>
        respuestaError(409, 'Este ticket ya fue cancelado'),
      ),
    )
    renderConProveedores(<RutasTickets />, {
      ruta: '/mis-tickets/TKT-CAR-001',
      sesion: sesionAutenticada(),
    })

    const usuario = userEvent.setup()
    await usuario.click(await screen.findByRole('button', { name: 'Cancelar ticket' }))
    await usuario.click(screen.getByRole('button', { name: 'Confirmar cancelación' }))

    const dialogo = await screen.findByRole('dialog')
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
      'Este ticket ya fue cancelado',
    )
    expect(screen.getByRole('button', { name: 'Confirmar cancelación' })).toBeInTheDocument()
  })

  it('TEST-FE-TKT-009: ticket ajeno 403/404 → "Ticket no disponible" sin datos', async () => {
    for (const estado of [403, 404]) {
      servidor.use(
        mswHttp.get(`${BASE}/tickets/:ticketCode`, () =>
          respuestaError(estado, 'Ticket ajeno'),
        ),
      )
      const vista = renderConProveedores(<DetalleTicket />, {
        ruta: '/mis-tickets/TKT-AJENO',
        rutaPatron: '/mis-tickets/:ticketCode',
        sesion: sesionAutenticada(),
      })

      expect(
        await within(vista.container).findByRole('heading', { name: 'Ticket no disponible' }),
      ).toBeInTheDocument()
      expect(within(vista.container).queryByText(ticketAndrea.eventName)).not.toBeInTheDocument()
      expect(within(vista.container).queryByText(ticketAndrea.ticketCode)).not.toBeInTheDocument()
      expect(
        within(vista.container).queryByRole('button', { name: 'Cancelar ticket' }),
      ).not.toBeInTheDocument()
      cleanup()
    }
  })

  it('TEST-FE-TKT-010: botón cancelar oculto si status ≠ PAID', async () => {
    servidor.use(
      mswHttp.get(`${BASE}/tickets/TKT-CAR-001`, () =>
        HttpResponse.json({ ...ticketCarlos, status: 'USED' }),
      ),
    )
    const vista = renderConProveedores(<DetalleTicket />, {
      ruta: '/mis-tickets/TKT-CAR-001',
      rutaPatron: '/mis-tickets/:ticketCode',
      sesion: sesionAutenticada(),
    })

    expect(
      await within(vista.container).findByRole('heading', { name: ticketCarlos.eventName }),
    ).toBeInTheDocument()
    expect(within(vista.container).getByText('USED')).toBeInTheDocument()
    expect(
      within(vista.container).queryByRole('button', { name: 'Cancelar ticket' }),
    ).not.toBeInTheDocument()
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserEvent } from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { http as mswHttp, HttpResponse } from 'msw'
import AdminCrearEvento from '../pages/AdminCrearEvento'
import AdminGestionEvento from '../pages/AdminGestionEvento'
import TicketsPagadosEvento from '../pages/TicketsPagadosEvento'
import ValidacionIngreso from '../pages/ValidacionIngreso'
import { artistas, evento, ticketAndrea, tickets } from './fixtures'
import { respuestaError } from './handlers'
import { servidor } from './servidor'
import { renderConProveedores, sesionAutenticada } from './utilidades'

const BASE = 'http://localhost/api'

interface CuerpoEvento {
  eventCode: string
  name: string
  description: string
  category: string
  eventDate: string
  minimumAge: number
  venueCode: string
}

function MonitorRuta() {
  const ubicacion = useLocation()
  return <span data-testid="ruta">{ubicacion.pathname}</span>
}

function RutasCrearEvento() {
  return (
    <Routes>
      <Route path="/admin/eventos/nuevo" element={<AdminCrearEvento />} />
      <Route path="/admin/eventos/:eventCode" element={<MonitorRuta />} />
    </Routes>
  )
}

function renderGestion() {
  return renderConProveedores(<AdminGestionEvento />, {
    ruta: '/admin/eventos/CMF-2026',
    rutaPatron: '/admin/eventos/:eventCode',
    sesion: sesionAutenticada(['ADMIN']),
  })
}

async function completarFormulario(usuario: UserEvent) {
  await usuario.type(screen.getByLabelText('Código del evento'), 'NEW-2026')
  await usuario.type(screen.getByLabelText('Nombre'), 'Nuevo Festival 2026')
  await usuario.type(screen.getByLabelText('Descripción'), 'Descripción de prueba')
  await usuario.selectOptions(screen.getByLabelText('Categoría'), 'MUSIC')
  await usuario.type(screen.getByLabelText('Fecha y hora'), '2027-12-15T20:00')
  const edad = screen.getByLabelText('Edad mínima')
  await usuario.clear(edad)
  await usuario.type(edad, '18')
  await usuario.selectOptions(screen.getByLabelText('Sede'), 'VEN-SMR-01')
}

afterEach(() => {
  cleanup()
})

describe('TEST-FE-STF', () => {
  it('TEST-FE-STF-001: validar ingreso: buscar y marcar como usado → éxito', async () => {
    let usos = 0
    servidor.use(
      mswHttp.patch(`${BASE}/tickets/:ticketCode/use`, ({ params }) => {
        usos += 1
        return HttpResponse.json({ ...ticketAndrea, status: 'USED', ticketCode: String(params.ticketCode) })
      }),
    )
    renderConProveedores(<ValidacionIngreso />, {
      ruta: '/staff/validacion',
      sesion: sesionAutenticada(['STAFF']),
    })

    const usuario = userEvent.setup()
    await usuario.type(screen.getByLabelText('Código de ticket'), ticketAndrea.ticketCode)
    await usuario.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(
      await screen.findByRole('button', { name: 'Marcar como usado' }),
    ).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Marcar como usado' }))

    expect(await screen.findByText('Ingreso registrado.')).toBeInTheDocument()
    expect(usos).toBe(1)
    expect(screen.getByLabelText('Código de ticket')).toHaveValue('')
  })

  it('TEST-FE-STF-002: validar ingreso: segunda vez → 409 visible', async () => {
    let usos = 0
    servidor.use(
      mswHttp.patch(`${BASE}/tickets/:ticketCode/use`, () => {
        usos += 1
        return usos === 1
          ? HttpResponse.json({ ...ticketAndrea, status: 'USED' })
          : respuestaError(409, 'Este ticket ya fue usado')
      }),
    )
    renderConProveedores(<ValidacionIngreso />, {
      ruta: '/staff/validacion',
      sesion: sesionAutenticada(['STAFF']),
    })

    const usuario = userEvent.setup()
    await usuario.type(screen.getByLabelText('Código de ticket'), ticketAndrea.ticketCode)
    await usuario.click(screen.getByRole('button', { name: 'Buscar' }))
    await usuario.click(await screen.findByRole('button', { name: 'Marcar como usado' }))
    expect(await screen.findByText('Ingreso registrado.')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Marcar como usado' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Este ticket ya fue usado')
    expect(usos).toBe(2)
  })

  it('TEST-FE-STF-003: validar ingreso: ticket inexistente → 404 visible', async () => {
    let consultas = 0
    servidor.use(
      mswHttp.get(`${BASE}/tickets/:ticketCode`, () => {
        consultas += 1
        return respuestaError(404, 'Ticket not found')
      }),
    )
    renderConProveedores(<ValidacionIngreso />, {
      ruta: '/staff/validacion',
      sesion: sesionAutenticada(['STAFF']),
    })

    const usuario = userEvent.setup()
    await usuario.type(screen.getByLabelText('Código de ticket'), 'TKT-NO-EXISTE')
    await usuario.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Ticket no disponible')
    expect(screen.queryByRole('button', { name: 'Marcar como usado' })).not.toBeInTheDocument()
    expect(consultas).toBeGreaterThan(0)
  })

  it('TEST-FE-STF-004: tickets pagados de evento: tabla con filas', async () => {
    renderConProveedores(<TicketsPagadosEvento />, {
      ruta: '/staff/eventos/CMF-2026/tickets',
      rutaPatron: '/staff/eventos/:eventCode/tickets',
      sesion: sesionAutenticada(['STAFF']),
    })

    const tabla = await screen.findByRole('table', {
      name: 'Tickets pagados del evento CMF-2026',
    })
    expect(within(tabla).getAllByRole('row')).toHaveLength(tickets.length + 1)
    for (const ticket of tickets) {
      expect(within(tabla).getByText(ticket.ticketCode)).toBeInTheDocument()
    }
    expect(screen.getByText(`Total: ${tickets.length}`)).toBeInTheDocument()
  })
})

describe('TEST-FE-ADM', () => {
  it('TEST-FE-ADM-001: crear evento: campos vacíos → errores y 0 peticiones', async () => {
    let peticiones = 0
    servidor.use(
      mswHttp.post(`${BASE}/events`, () => {
        peticiones += 1
        return HttpResponse.json({ ...evento, status: 'DRAFT' }, { status: 201 })
      }),
    )
    renderConProveedores(<AdminCrearEvento />, {
      ruta: '/admin/eventos/nuevo',
      sesion: sesionAutenticada(['ADMIN']),
    })

    const usuario = userEvent.setup()
    await usuario.click(await screen.findByRole('button', { name: 'Crear evento' }))

    expect(await screen.findByText('El código es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('La fecha es obligatoria')).toBeInTheDocument()
    expect(screen.getByText('Selecciona una sede', { selector: 'p' })).toBeInTheDocument()
    expect(peticiones).toBe(0)
  })

  it('TEST-FE-ADM-002: crear evento: 201 → navega a gestión', async () => {
    let peticiones = 0
    let cuerpo: CuerpoEvento | null = null
    servidor.use(
      mswHttp.post(`${BASE}/events`, async ({ request }) => {
        peticiones += 1
        cuerpo = (await request.json()) as CuerpoEvento
        return HttpResponse.json(
          { ...evento, eventCode: 'NEW-2026', status: 'DRAFT' },
          { status: 201 },
        )
      }),
    )
    renderConProveedores(<RutasCrearEvento />, {
      ruta: '/admin/eventos/nuevo',
      sesion: sesionAutenticada(['ADMIN']),
    })

    const usuario = userEvent.setup()
    await completarFormulario(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Crear evento' }))

    expect(await screen.findByTestId('ruta')).toHaveTextContent('/admin/eventos/NEW-2026')
    expect(peticiones).toBe(1)
    expect(cuerpo).toEqual({
      eventCode: 'NEW-2026',
      name: 'Nuevo Festival 2026',
      description: 'Descripción de prueba',
      category: 'MUSIC',
      eventDate: '2027-12-15T20:00',
      minimumAge: 18,
      venueCode: 'VEN-SMR-01',
    })
  })

  it('TEST-FE-ADM-003: crear evento: 400 con details → errores en campos', async () => {
    servidor.use(
      mswHttp.post(`${BASE}/events`, () =>
        respuestaError(400, 'Revisa los datos', {
          eventCode: 'El código ya está en uso',
          name: 'El nombre no es válido',
        }),
      ),
    )
    renderConProveedores(<AdminCrearEvento />, {
      ruta: '/admin/eventos/nuevo',
      sesion: sesionAutenticada(['ADMIN']),
    })

    const usuario = userEvent.setup()
    await completarFormulario(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Crear evento' }))

    expect(await screen.findByText('El código ya está en uso')).toBeInTheDocument()
    expect(screen.getByText('El nombre no es válido')).toBeInTheDocument()
    expect(screen.getByLabelText('Código del evento')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true')
  })

  it('TEST-FE-ADM-004: publicar evento → badge PUBLISHED', async () => {
    let publicado = false
    servidor.use(
      mswHttp.get(`${BASE}/events/:eventCode`, () =>
        HttpResponse.json({ ...evento, status: publicado ? 'PUBLISHED' : 'DRAFT' }),
      ),
      mswHttp.patch(`${BASE}/events/:eventCode/publish`, () => {
        publicado = true
        return HttpResponse.json({ ...evento, status: 'PUBLISHED' })
      }),
    )
    renderGestion()

    expect(await screen.findByRole('heading', { name: evento.name })).toBeInTheDocument()
    expect(screen.getByText('DRAFT')).toBeInTheDocument()

    const usuario = userEvent.setup()
    await usuario.click(screen.getByRole('button', { name: 'Publicar' }))
    const dialogo = await screen.findByRole('dialog')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Publicar' }))

    expect(await screen.findByText('Evento publicado.')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument()
    })
  })

  it('TEST-FE-ADM-005: publicar → 409 visible', async () => {
    servidor.use(
      mswHttp.get(`${BASE}/events/:eventCode`, () =>
        HttpResponse.json({ ...evento, status: 'DRAFT' }),
      ),
      mswHttp.patch(`${BASE}/events/:eventCode/publish`, () =>
        respuestaError(409, 'El evento no se puede publicar'),
      ),
    )
    renderGestion()

    expect(await screen.findByRole('heading', { name: evento.name })).toBeInTheDocument()

    const usuario = userEvent.setup()
    await usuario.click(screen.getByRole('button', { name: 'Publicar' }))
    const dialogo = await screen.findByRole('dialog')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Publicar' }))

    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
      'El evento no se puede publicar',
    )
    expect(screen.getByText('DRAFT')).toBeInTheDocument()
  })

  it('TEST-FE-ADM-006: asociar artista → aparece en la lista; duplicado → 409', async () => {
    const asociados: number[] = []
    let intentos = 0
    servidor.use(
      mswHttp.get(`${BASE}/events/:eventCode`, () =>
        HttpResponse.json({
          ...evento,
          artists: artistas.filter((artista) => asociados.includes(artista.id)),
        }),
      ),
      mswHttp.post(`${BASE}/events/:eventCode/artists/:artistId`, ({ params }) => {
        intentos += 1
        if (intentos > 1) {
          return respuestaError(409, 'El artista ya está asociado al evento')
        }
        asociados.push(Number(params.artistId))
        return HttpResponse.json({
          ...evento,
          artists: artistas.filter((artista) => asociados.includes(artista.id)),
        })
      }),
    )
    renderGestion()

    expect(await screen.findByText('Sin artistas registrados.')).toBeInTheDocument()

    const usuario = userEvent.setup()
    await usuario.selectOptions(screen.getByLabelText('Agregar artista'), '2')
    await usuario.click(screen.getByRole('button', { name: 'Asociar artista' }))

    const lista = await screen.findByRole('list')
    expect(within(lista).getByText('Neon Waves')).toBeInTheDocument()

    await usuario.selectOptions(screen.getByLabelText('Agregar artista'), '1')
    await usuario.click(screen.getByRole('button', { name: 'Asociar artista' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El artista ya está asociado al evento',
    )
    expect(intentos).toBe(2)
  })
})

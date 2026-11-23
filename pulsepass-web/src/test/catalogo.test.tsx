import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSearchParams } from 'react-router'
import { http as mswHttp, HttpResponse } from 'msw'
import CatalogoEventos from '../pages/CatalogoEventos'
import DetalleArtista from '../pages/DetalleArtista'
import DetalleEvento from '../pages/DetalleEvento'
import DetalleSede from '../pages/DetalleSede'
import ListaArtistas from '../pages/ListaArtistas'
import ListaSedes from '../pages/ListaSedes'
import type { EventResponse } from '../funcionalidades/eventos/tipos'
import { artistas, evento, sede } from './fixtures'
import { respuestaError } from './handlers'
import { servidor } from './servidor'
import { renderConProveedores, sesionAutenticada } from './utilidades'

const BASE = 'http://localhost/api'

function MonitorConsulta() {
  const [parametros] = useSearchParams()
  return <span data-testid="consulta-url">{parametros.toString()}</span>
}

afterEach(() => {
  cleanup()
})

describe('TEST-FE-EVT', () => {
  it('TEST-FE-EVT-001: cartelera lista eventos publicados', async () => {
    renderConProveedores(<CatalogoEventos />, { ruta: '/eventos' })

    const enlace = await screen.findByRole('link', {
      name: /Caribbean Music Fest 2026/,
    })

    expect(enlace).toBeInTheDocument()
    expect(within(enlace).getByText('PUBLISHED')).toBeInTheDocument()
    expect(within(enlace).getByText('Música')).toBeInTheDocument()
    expect(within(enlace).getByText(sede.name)).toBeInTheDocument()
    expect(screen.getByText('1 eventos')).toBeInTheDocument()
  })

  it('TEST-FE-EVT-002: cartelera lista vacía → estado vacío', async () => {
    servidor.use(mswHttp.get(`${BASE}/events/published`, () => HttpResponse.json([])))
    renderConProveedores(<CatalogoEventos />, { ruta: '/eventos' })

    expect(await screen.findByText('Aún no hay eventos publicados')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Caribbean Music Fest 2026/ })).not.toBeInTheDocument()
  })

  it('TEST-FE-EVT-003: cartelera filtro por texto/categoría actualiza la URL', async () => {
    renderConProveedores(
      <>
        <CatalogoEventos />
        <MonitorConsulta />
      </>,
      { ruta: '/eventos' },
    )

    const usuario = userEvent.setup()
    await usuario.type(screen.getByLabelText('Buscar por nombre o ciudad'), 'caribbean')
    await usuario.selectOptions(screen.getByLabelText('Categoría'), 'MUSIC')

    await waitFor(() => {
      expect(screen.getByTestId('consulta-url')).toHaveTextContent('q=caribbean')
      expect(screen.getByTestId('consulta-url')).toHaveTextContent('categoria=MUSIC')
      expect(screen.getByText('1 eventos')).toBeInTheDocument()
    })
  })

  it('TEST-FE-EVT-004: detalle muestra evento, artistas y sede', async () => {
    renderConProveedores(<DetalleEvento />, {
      ruta: '/eventos/CMF-2026',
      rutaPatron: '/eventos/:eventCode',
    })

    expect(
      await screen.findByRole('heading', { name: 'Caribbean Music Fest 2026' }),
    ).toBeInTheDocument()
    expect(screen.getByText(evento.description ?? '')).toBeInTheDocument()
    for (const artista of artistas) {
      expect(screen.getByRole('link', { name: artista.stageName })).toBeInTheDocument()
    }
    expect(await screen.findByText('Santa Marta')).toBeInTheDocument()
    expect(screen.getByText(sede.address ?? '')).toBeInTheDocument()
  })

  it('TEST-FE-EVT-005: detalle 404 → "Evento no disponible"', async () => {
    servidor.use(
      mswHttp.get(`${BASE}/events/:eventCode`, () => respuestaError(404, 'Event not found')),
    )
    renderConProveedores(<DetalleEvento />, {
      ruta: '/eventos/NO-EXISTE',
      rutaPatron: '/eventos/:eventCode',
    })

    expect(
      await screen.findByRole('heading', { name: 'Evento no disponible' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Caribbean Music Fest 2026')).not.toBeInTheDocument()
  })

  it('TEST-FE-EVT-006: detalle evento SOLD_OUT → compra deshabilitada', async () => {
    const vendido: EventResponse = { ...evento, status: 'SOLD_OUT' }
    servidor.use(mswHttp.get(`${BASE}/events/CMF-2026`, () => HttpResponse.json(vendido)))
    renderConProveedores(<DetalleEvento />, {
      ruta: '/eventos/CMF-2026',
      rutaPatron: '/eventos/:eventCode',
      sesion: sesionAutenticada(),
    })

    expect(await screen.findByText('SOLD_OUT')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comprar entrada' })).toBeDisabled()
  })
})

describe('TEST-FE-ART', () => {
  it('TEST-FE-ART-001: lista de artistas activos', async () => {
    renderConProveedores(<ListaArtistas />, { ruta: '/artistas' })

    expect(await screen.findByRole('heading', { name: 'Artistas' })).toBeInTheDocument()
    await waitFor(() => {
      for (const artista of artistas) {
        expect(screen.getByRole('link', { name: new RegExp(artista.stageName) })).toBeInTheDocument()
        expect(screen.getByText(artista.genre ?? '')).toBeInTheDocument()
      }
    })
  })

  it('TEST-FE-ART-002: detalle de artista con eventos', async () => {
    renderConProveedores(<DetalleArtista />, {
      ruta: '/artistas/1',
      rutaPatron: '/artistas/:id',
    })

    expect(await screen.findByRole('heading', { name: 'Solar Beat' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Próximos eventos de Solar Beat' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Electrónica')).toBeInTheDocument()
    expect(
      await screen.findByRole('link', { name: /Caribbean Music Fest 2026/ }),
    ).toBeInTheDocument()
  })

  it('TEST-FE-ART-003: id no numérico → 404 sin llamar a la API', async () => {
    const espiaFetch = vi.spyOn(globalThis, 'fetch')
    const vista = renderConProveedores(<DetalleArtista />, {
      ruta: '/artistas/no-numerico',
      rutaPatron: '/artistas/:id',
    })

    expect(await within(vista.container).findByText('404')).toBeInTheDocument()
    expect(
      within(vista.container).getByRole('heading', { name: 'No encontramos esta página' }),
    ).toBeInTheDocument()
    expect(
      espiaFetch.mock.calls.filter(([entrada]) => String(entrada).includes('/artists/')),
    ).toHaveLength(0)
  })
})

describe('TEST-FE-VEN', () => {
  it('TEST-FE-VEN-001: lista y detalle de sede; 404 de sede', async () => {
    const lista = renderConProveedores(<ListaSedes />, { ruta: '/sedes' })

    expect(
      await within(lista.container).findByRole('link', {
        name: new RegExp(sede.name),
      }),
    ).toBeInTheDocument()
    expect(within(lista.container).getByText(sede.city)).toBeInTheDocument()
    cleanup()

    const detalle = renderConProveedores(<DetalleSede />, {
      ruta: '/sedes/VEN-SMR-01',
      rutaPatron: '/sedes/:code',
    })

    expect(
      await within(detalle.container).findByRole('heading', { name: sede.name }),
    ).toBeInTheDocument()
    expect(within(detalle.container).getByText(sede.address ?? '')).toBeInTheDocument()
    expect(within(detalle.container).getByText(`${sede.capacity} personas`)).toBeInTheDocument()
    cleanup()

    servidor.use(
      mswHttp.get(`${BASE}/venues/:code`, () => respuestaError(404, 'Venue not found')),
    )
    const ausente = renderConProveedores(<DetalleSede />, {
      ruta: '/sedes/NO-EXISTE',
      rutaPatron: '/sedes/:code',
    })

    expect(await within(ausente.container).findByText('404')).toBeInTheDocument()
    expect(within(ausente.container).queryByText(sede.name)).not.toBeInTheDocument()
  })
})

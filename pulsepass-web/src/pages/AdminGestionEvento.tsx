import { Component, useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { z } from 'zod'
import Aviso from '../componentes/Aviso'
import Badge from '../componentes/Badge'
import Boton from '../componentes/Boton'
import Cargando from '../componentes/Cargando'
import { CodigoTexto } from '../componentes/CodigoTexto'
import EstadoError from '../componentes/EstadoError'
import EstadoVacio from '../componentes/EstadoVacio'
import { IconoCalendario, IconoUsuario } from '../componentes/Iconos'
import Modal from '../componentes/Modal'
import Selector from '../componentes/Selector'
import Tarjeta from '../componentes/Tarjeta'
import { useArtistasActivos } from '../funcionalidades/artistas/hooks'
import { useAsociarArtista, useEvento, usePublicarEvento } from '../funcionalidades/eventos/hooks'
import type { EventCategory } from '../funcionalidades/eventos/tipos'
import { ContenedorEstrecho } from '../layouts/Layout'
import { formatearFecha, formatearHora } from '../lib/formato'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'

const EsquemaCodigoEvento = z.object({
  eventCode: z.string().trim().min(1).max(50),
})

const ETIQUETAS_CATEGORIA: Record<EventCategory, string> = {
  MUSIC: 'Música',
  SPORTS: 'Deportes',
  TECHNOLOGY: 'Tecnología',
  EDUCATION: 'Educación',
  CULTURE: 'Cultura',
  ENTERTAINMENT: 'Entretenimiento',
}

interface AvisoVisible {
  tipo: 'exito' | 'error'
  mensaje: string
}

function es403(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403
}

function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return Object.values(error.details).join(' ') || error.message || 'Revisa los datos.'
    }
    if (error.status === 409) return error.message
    if (error.status === 0) return 'No pudimos conectar con el servidor.'
    if (error.status >= 500) return 'Ocurrió un error inesperado. Inténtalo más tarde.'
    return error.message
  }
  return 'Ocurrió un error inesperado. Inténtalo más tarde.'
}

class LimiteErrorEvento extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (es403(error)) return <Navigate to={RUTAS.sinPermisos} replace />
    throw error
  }
}

export default function AdminGestionEvento() {
  return (
    <LimiteErrorEvento>
      <ContenidoAdminGestionEvento />
    </LimiteErrorEvento>
  )
}

function ContenidoAdminGestionEvento() {
  const navigate = useNavigate()
  const { eventCode } = useParams()
  const validado = EsquemaCodigoEvento.safeParse({ eventCode: eventCode ?? '' })
  const codigo = validado.success ? validado.data.eventCode : ''
  const consulta = useEvento(codigo, { throwOnError: true })
  const consultaArtistas = useArtistasActivos()
  const publicacion = usePublicarEvento()
  const asociacion = useAsociarArtista()
  const [confirmando, setConfirmando] = useState(false)
  const [aviso, setAviso] = useState<AvisoVisible | null>(null)
  const [seleccion, setSeleccion] = useState('')

  const cerrarModal = useCallback(() => {
    setConfirmando(false)
  }, [])

  const evento = consulta.data
  const artistas = consultaArtistas.data ?? []
  const asociados = new Set(evento?.artists.map((artista) => artista.id) ?? [])
  const opcionesArtistas = artistas
    .filter((artista) => !asociados.has(artista.id))
    .map((artista) => ({ valor: String(artista.id), etiqueta: artista.stageName }))
  const elegido = artistas.find(
    (artista) => String(artista.id) === seleccion && !asociados.has(artista.id),
  )

  async function publicarEvento() {
    if (!evento) return
    setAviso(null)
    try {
      await publicacion.mutateAsync(evento.eventCode)
      setConfirmando(false)
      setAviso({ tipo: 'exito', mensaje: 'Evento publicado.' })
    } catch (error) {
      if (es403(error)) {
        navigate(RUTAS.sinPermisos)
        return
      }
      setAviso({ tipo: 'error', mensaje: mensajeError(error) })
    }
  }

  async function asociarArtista() {
    if (!evento || !elegido) return
    setAviso(null)
    try {
      await asociacion.mutateAsync({
        eventCode: evento.eventCode,
        artistId: elegido.id,
        stageName: elegido.stageName,
      })
      setSeleccion('')
      setAviso({ tipo: 'exito', mensaje: 'Artista asociado.' })
    } catch (error) {
      if (es403(error)) {
        navigate(RUTAS.sinPermisos)
        return
      }
      setAviso({ tipo: 'error', mensaje: mensajeError(error) })
    }
  }

  if (!validado.success) {
    return (
      <ContenedorEstrecho>
        <Aviso tipo="error" mensaje="El código de evento no es válido." />
      </ContenedorEstrecho>
    )
  }

  if (consulta.isPending) {
    return (
      <ContenedorEstrecho>
        <Cargando etiqueta="Cargando evento" lineas={5} />
      </ContenedorEstrecho>
    )
  }

  if (consulta.error) {
    return (
      <ContenedorEstrecho>
        <EstadoError
          mensaje={mensajeError(consulta.error)}
          onReintentar={() => void consulta.refetch()}
        />
      </ContenedorEstrecho>
    )
  }

  if (!evento) {
    return (
      <ContenedorEstrecho>
        <EstadoVacio mensaje="Evento no disponible" />
      </ContenedorEstrecho>
    )
  }

  return (
    <ContenedorEstrecho>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <LinkAdministrar />
            <h1 className="mt-2 font-titulo text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
              {evento.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Código: <CodigoTexto>{evento.eventCode}</CodigoTexto>
            </p>
          </div>
          <Badge estado={evento.status} />
        </div>

        {aviso ? (
          <div className="mt-4">
            <Aviso tipo={aviso.tipo} mensaje={aviso.mensaje} />
          </div>
        ) : null}

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Categoría
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              {ETIQUETAS_CATEGORIA[evento.category]}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Fecha y hora
            </dt>
            <dd className="mt-1 flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
              <IconoCalendario className="h-4 w-4 shrink-0" />
              {formatearFecha(evento.eventDate)} · {formatearHora(evento.eventDate)}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Edad mínima
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              {evento.minimumAge === null ? 'Sin restricción' : `${evento.minimumAge} años`}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Sede
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              {evento.venueName ?? 'Sede por definir'}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Descripción
            </dt>
            <dd className="mt-1 whitespace-pre-line text-slate-700 dark:text-slate-300">
              {evento.description ?? 'Sin descripción disponible.'}
            </dd>
          </div>
        </dl>

        <Tarjeta className="mt-6 p-5">
          <h2 className="font-titulo text-xl font-bold text-slate-900 dark:text-slate-100">
            Publicación
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            El evento es visible al público una vez publicado.
          </p>
          {evento.status === 'DRAFT' ? (
            <div className="mt-4 flex justify-end">
              <Boton onClick={() => setConfirmando(true)}>Publicar</Boton>
            </div>
          ) : (
            <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
              El evento ya no está en borrador.
            </p>
          )}
        </Tarjeta>

        <Tarjeta className="mt-6 p-5">
          <h2 className="font-titulo text-xl font-bold text-slate-900 dark:text-slate-100">
            Artistas asociados
          </h2>
          {evento.artists.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Sin artistas registrados.
            </p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-2">
              {evento.artists.map((artista) => (
                <li
                  key={artista.id}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  <IconoUsuario className="h-4 w-4 shrink-0" />
                  {artista.stageName}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <Selector
              etiqueta="Agregar artista"
              opciones={opcionesArtistas}
              opcionVacia={
                consultaArtistas.isPending
                  ? 'Cargando artistas…'
                  : opcionesArtistas.length === 0
                    ? 'No hay artistas disponibles'
                    : 'Selecciona un artista'
              }
              value={seleccion}
              onChange={(eventoSelect) => setSeleccion(eventoSelect.target.value)}
              disabled={opcionesArtistas.length === 0}
            />
            <Boton
              cargando={asociacion.isPending}
              disabled={!elegido}
              onClick={() => void asociarArtista()}
            >
              Asociar artista
            </Boton>
          </div>
          {consultaArtistas.error ? (
            <p className="mt-2 text-sm text-red-700 dark:text-red-400" role="alert">
              No pudimos cargar los artistas activos.
            </p>
          ) : null}
        </Tarjeta>

        <p className="mt-6 text-sm">
          <Link
            to={RUTAS.ticketsPagados(evento.eventCode)}
            className="font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
          >
            Ver tickets pagados del evento
          </Link>
        </p>
      </div>

      <Modal abierto={confirmando} titulo="Publicar evento" onCerrar={cerrarModal}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          ¿Seguro que deseas publicar «{evento.name}»? El evento será visible al público.
        </p>
        {aviso?.tipo === 'error' ? (
          <div className="mt-4">
            <Aviso tipo="error" mensaje={aviso.mensaje} />
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Boton variante="secundario" onClick={cerrarModal}>
            Cancelar
          </Boton>
          <Boton cargando={publicacion.isPending} onClick={() => void publicarEvento()}>
            Publicar
          </Boton>
        </div>
      </Modal>
    </ContenedorEstrecho>
  )
}

function LinkAdministrar() {
  return (
    <Link
      to={RUTAS.adminEventos}
      className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
    >
      ← Eventos
    </Link>
  )
}

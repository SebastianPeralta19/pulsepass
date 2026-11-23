import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { z } from 'zod'
import ArtistasAdminEvento from '../componentes/ArtistasAdminEvento'
import CabeceraAdminEvento from '../componentes/CabeceraAdminEvento'
import DetallesAdminEvento from '../componentes/DetallesAdminEvento'
import EnlaceTicketsPagadosAdmin from '../componentes/EnlaceTicketsPagadosAdmin'
import { AvisoCodigoInvalido, CargandoEventoAdmin, ErrorEventoAdmin, EventoNoDisponibleAdmin } from '../componentes/EstadosAdminEvento'
import { es403, LimiteErrorAdminEvento, mensajeErrorAdminEvento } from '../componentes/LimiteErrorAdminEvento'
import ModalPublicarEvento from '../componentes/ModalPublicarEvento'
import PublicacionAdminEvento from '../componentes/PublicacionAdminEvento'
import { useArtistasActivos } from '../funcionalidades/artistas/hooks'
import { useAsociarArtista, useEvento, usePublicarEvento } from '../funcionalidades/eventos/hooks'
import { ContenedorEstrecho } from '../layouts/Layout'
import { RUTAS } from '../lib/rutas'

const EsquemaCodigoEvento = z.object({
  eventCode: z.string().trim().min(1).max(50),
})

interface AvisoVisible {
  tipo: 'exito' | 'error'
  mensaje: string
}

export default function AdminGestionEvento() {
  return (
    <LimiteErrorAdminEvento>
      <ContenidoAdminGestionEvento />
    </LimiteErrorAdminEvento>
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
      setAviso({ tipo: 'error', mensaje: mensajeErrorAdminEvento(error) })
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
      setAviso({ tipo: 'error', mensaje: mensajeErrorAdminEvento(error) })
    }
  }

  if (!validado.success) return <AvisoCodigoInvalido />

  if (consulta.isPending) return <CargandoEventoAdmin />

  if (consulta.error) {
    return (
      <ErrorEventoAdmin
        mensaje={mensajeErrorAdminEvento(consulta.error)}
        onReintentar={() => void consulta.refetch()}
      />
    )
  }

  if (!evento) return <EventoNoDisponibleAdmin />

  return (
    <ContenedorEstrecho>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CabeceraAdminEvento evento={evento} aviso={aviso} />
        <DetallesAdminEvento evento={evento} />
        <PublicacionAdminEvento
          borrador={evento.status === 'DRAFT'}
          onPublicar={() => setConfirmando(true)}
        />
        <ArtistasAdminEvento
          artistas={evento.artists}
          opciones={opcionesArtistas}
          seleccion={seleccion}
          cargandoArtistas={consultaArtistas.isPending}
          errorArtistas={consultaArtistas.error}
          asociando={asociacion.isPending}
          puedeAsociar={Boolean(elegido)}
          onSeleccionar={setSeleccion}
          onAsociar={() => void asociarArtista()}
        />
        <EnlaceTicketsPagadosAdmin eventCode={evento.eventCode} />
      </div>
      <ModalPublicarEvento
        abierto={confirmando}
        nombre={evento.name}
        aviso={aviso}
        publicando={publicacion.isPending}
        onCerrar={cerrarModal}
        onPublicar={() => void publicarEvento()}
      />
    </ContenedorEstrecho>
  )
}

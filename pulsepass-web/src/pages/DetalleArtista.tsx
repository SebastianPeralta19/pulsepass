import { Link, useParams } from 'react-router'
import { z } from 'zod'
import Cargando from '../componentes/Cargando'
import EstadoError from '../componentes/EstadoError'
import { IconoFlechaIzquierda } from '../componentes/Iconos'
import ListaEventosArtista from '../componentes/ListaEventosArtista'
import { mensajeErrorCarga } from '../componentes/MensajesCarga'
import TarjetaArtista from '../componentes/TarjetaArtista'
import { useArtista } from '../funcionalidades/artistas/hooks'
import { useEventosPorArtista } from '../funcionalidades/eventos/hooks'
import { Contenedor } from '../layouts/Layout'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'
import NoEncontrada from './NoEncontrada'

const EsquemaId = z.coerce.number().int().positive()

function ContenidoArtista({ id }: { id: number }) {
  const consulta = useArtista(id)
  const artista = consulta.data
  const consultaEventos = useEventosPorArtista(artista?.stageName ?? '')

  if (consulta.error) {
    if (
      consulta.error instanceof ApiError &&
      (consulta.error.status === 403 || consulta.error.status === 404)
    ) {
      return <NoEncontrada />
    }
    return (
      <Contenedor>
        <EstadoError
          mensaje={mensajeErrorCarga(consulta.error)}
          onReintentar={() => void consulta.refetch()}
        />
      </Contenedor>
    )
  }

  if (consulta.isPending) {
    return (
      <Contenedor>
        <Cargando etiqueta="Cargando artista" lineas={4} />
      </Contenedor>
    )
  }

  if (!artista) return <NoEncontrada />

  return (
    <Contenedor>
      <Link
        to={RUTAS.artistas}
        className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
      >
        <IconoFlechaIzquierda className="h-4 w-4" />
        Artistas
      </Link>
      <TarjetaArtista artista={artista} />
      <ListaEventosArtista
        artista={artista.stageName}
        eventos={consultaEventos.data}
        cargando={consultaEventos.isPending}
        error={consultaEventos.error}
        onReintentar={() => void consultaEventos.refetch()}
      />
    </Contenedor>
  )
}

export default function DetalleArtista() {
  const { id } = useParams()
  const validado = EsquemaId.safeParse(id)
  if (!validado.success) return <NoEncontrada />
  return <ContenidoArtista id={validado.data} />
}

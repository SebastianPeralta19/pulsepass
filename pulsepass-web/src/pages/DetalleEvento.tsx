import { Link, useParams } from 'react-router'
import Cargando from '../componentes/Cargando'
import EstadoError from '../componentes/EstadoError'
import EstadoVacio from '../componentes/EstadoVacio'
import FichaEvento from '../componentes/FichaEvento'
import { IconoFlechaIzquierda } from '../componentes/Iconos'
import ListaArtistasEvento from '../componentes/ListaArtistasEvento'
import Tarjeta from '../componentes/Tarjeta'
import TarjetaSedeEvento from '../componentes/TarjetaSedeEvento'
import { useEvento } from '../funcionalidades/eventos/hooks'
import { useSede } from '../funcionalidades/sedes/hooks'
import ComprarTicket from '../funcionalidades/tickets/ComprarTicket'
import { Contenedor } from '../layouts/Layout'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos cargar el evento.'
}

export default function DetalleEvento() {
  const { eventCode } = useParams()
  const codigo = eventCode ?? ''
  const consulta = useEvento(codigo)
  const evento = consulta.data
  const consultaSede = useSede(evento?.venueCode ?? '')

  if (consulta.error) {
    if (
      consulta.error instanceof ApiError &&
      (consulta.error.status === 403 || consulta.error.status === 404)
    ) {
      return (
        <Contenedor>
          <h1 className="font-titulo text-3xl font-bold">Evento no disponible</h1>
        </Contenedor>
      )
    }
    return (
      <Contenedor>
        <EstadoError
          mensaje={mensajeError(consulta.error)}
          onReintentar={() => void consulta.refetch()}
        />
      </Contenedor>
    )
  }

  if (consulta.isPending) {
    return (
      <Contenedor>
        <Cargando etiqueta="Cargando evento" lineas={5} />
      </Contenedor>
    )
  }

  if (!evento) {
    return (
      <Contenedor>
        <EstadoVacio mensaje="Evento no disponible" />
      </Contenedor>
    )
  }

  return (
    <Contenedor>
      <Link
        to={RUTAS.eventos}
        className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
      >
        <IconoFlechaIzquierda className="h-4 w-4" />
        Volver a la cartelera
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <FichaEvento evento={evento} />
          <ListaArtistasEvento artistas={evento.artists} />
        </div>
        <aside className="space-y-6">
          <TarjetaSedeEvento evento={evento} sede={consultaSede.data} />
          <Tarjeta className="p-6">
            <h2 className="font-titulo text-xl font-bold">Entradas</h2>
            <div className="mt-4">
              <ComprarTicket eventCode={codigo} deshabilitado={evento?.status === 'SOLD_OUT'} />
            </div>
          </Tarjeta>
        </aside>
      </div>
    </Contenedor>
  )
}

import Aviso from './Aviso'
import Cargando from './Cargando'
import EstadoError from './EstadoError'
import EstadoVacio from './EstadoVacio'
import { ContenedorEstrecho } from '../layouts/Layout'

export function AvisoCodigoInvalido() {
  return (
    <ContenedorEstrecho>
      <Aviso tipo="error" mensaje="El código de evento no es válido." />
    </ContenedorEstrecho>
  )
}

export function CargandoEventoAdmin() {
  return (
    <ContenedorEstrecho>
      <Cargando etiqueta="Cargando evento" lineas={5} />
    </ContenedorEstrecho>
  )
}

export function ErrorEventoAdmin({
  mensaje,
  onReintentar,
}: {
  mensaje: string
  onReintentar: () => void
}) {
  return (
    <ContenedorEstrecho>
      <EstadoError mensaje={mensaje} onReintentar={onReintentar} />
    </ContenedorEstrecho>
  )
}

export function EventoNoDisponibleAdmin() {
  return (
    <ContenedorEstrecho>
      <EstadoVacio mensaje="Evento no disponible" />
    </ContenedorEstrecho>
  )
}

import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import { z } from 'zod'
import Boton from '../componentes/Boton'
import Cargando from '../componentes/Cargando'
import EstadoError from '../componentes/EstadoError'
import FichaTicket from '../componentes/FichaTicket'
import {
  mensajeCancelacionTicket,
  mensajeCargaTicket,
} from '../componentes/ErroresTicket'
import { IconoFlechaIzquierda } from '../componentes/Iconos'
import ModalCancelacionTicket from '../componentes/ModalCancelacionTicket'
import { useCancelarTicket, useTicket } from '../funcionalidades/tickets/hooks'
import { Contenedor } from '../layouts/Layout'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'

const EsquemaCodigoTicket = z.object({
  ticketCode: z.string().min(1),
})

function NoDisponibleTicket() {
  return (
    <Contenedor>
      <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100">
        Ticket no disponible
      </h1>
    </Contenedor>
  )
}

export default function DetalleTicket() {
  const { ticketCode } = useParams()
  const resultado = EsquemaCodigoTicket.safeParse({ ticketCode: ticketCode ?? '' })
  const codigo = resultado.success ? resultado.data.ticketCode : ''
  const consulta = useTicket(codigo)
  const cancelacion = useCancelarTicket()
  const [confirmando, setConfirmando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const ticket = consulta.data

  const cerrar = useCallback(() => {
    setConfirmando(false)
    setMensaje('')
  }, [])

  function abrir() {
    setMensaje('')
    setConfirmando(true)
  }

  async function cancelar() {
    if (!ticket) return
    setMensaje('')
    try {
      await cancelacion.mutateAsync({
        ticketCode: ticket.ticketCode,
        eventCode: ticket.eventCode,
        email: ticket.userEmail,
      })
      cerrar()
    } catch (error) {
      setMensaje(mensajeCancelacionTicket(error))
    }
  }

  if (!resultado.success) return <NoDisponibleTicket />

  if (consulta.error) {
    if (
      consulta.error instanceof ApiError &&
      (consulta.error.status === 403 || consulta.error.status === 404)
    ) {
      return <NoDisponibleTicket />
    }
    return (
      <Contenedor>
        <EstadoError
          mensaje={mensajeCargaTicket(consulta.error)}
          onReintentar={() => void consulta.refetch()}
        />
      </Contenedor>
    )
  }

  if (consulta.isPending) {
    return (
      <Contenedor>
        <Cargando etiqueta="Cargando ticket" lineas={5} />
      </Contenedor>
    )
  }

  if (!ticket) return <NoDisponibleTicket />

  return (
    <Contenedor>
      <Link
        to={RUTAS.misTickets}
        className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
      >
        <IconoFlechaIzquierda className="h-4 w-4" />
        Mis tickets
      </Link>
      <FichaTicket ticket={ticket} />
      {ticket.status === 'PAID' ? (
        <div className="mt-6 flex justify-end">
          <Boton variante="peligro" onClick={abrir}>
            Cancelar ticket
          </Boton>
        </div>
      ) : null}
      <ModalCancelacionTicket
        abierto={confirmando}
        mensaje={mensaje}
        cancelando={cancelacion.isPending}
        onCerrar={cerrar}
        onCancelar={() => void cancelar()}
      />
    </Contenedor>
  )
}

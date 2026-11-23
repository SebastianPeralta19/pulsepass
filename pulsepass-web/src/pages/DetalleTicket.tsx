import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import { z } from 'zod'
import Aviso from '../componentes/Aviso'
import Badge from '../componentes/Badge'
import Boton from '../componentes/Boton'
import Cargando from '../componentes/Cargando'
import { CodigoTexto } from '../componentes/CodigoTexto'
import EstadoError from '../componentes/EstadoError'
import { IconoFlechaIzquierda } from '../componentes/Iconos'
import Modal from '../componentes/Modal'
import Tarjeta from '../componentes/Tarjeta'
import { useTicket, useCancelarTicket } from '../funcionalidades/tickets/hooks'
import { Contenedor } from '../layouts/Layout'
import { formatearCOP, formatearFecha } from '../lib/formato'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'

const EsquemaCodigoTicket = z.object({
  ticketCode: z.string().min(1),
})

function mensajeCancelacion(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Ocurrió un error inesperado. Inténtalo más tarde.'
  }
  if (error.status === 409) return error.message
  if (error.status === 403 || error.status === 404) return 'Ticket no disponible'
  if (error.status === 400) {
    return Object.values(error.details).join(' ') || error.message || 'Revisa los datos.'
  }
  if (error.status === 0) {
    return 'No pudimos conectar con el servidor. Inténtalo más tarde.'
  }
  if (error.status >= 500) {
    return 'Ocurrió un error inesperado. Inténtalo más tarde.'
  }
  return error.message
}

function mensajeCarga(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos cargar el ticket.'
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
      setMensaje(mensajeCancelacion(error))
    }
  }

  if (!resultado.success) {
    return (
      <Contenedor>
        <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100">
          Ticket no disponible
        </h1>
      </Contenedor>
    )
  }

  if (consulta.error) {
    if (
      consulta.error instanceof ApiError &&
      (consulta.error.status === 403 || consulta.error.status === 404)
    ) {
      return (
        <Contenedor>
          <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100">
            Ticket no disponible
          </h1>
        </Contenedor>
      )
    }
    return (
      <Contenedor>
        <EstadoError
          mensaje={mensajeCarga(consulta.error)}
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

  if (!ticket) {
    return (
      <Contenedor>
        <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100">
          Ticket no disponible
        </h1>
      </Contenedor>
    )
  }

  return (
    <Contenedor>
      <Link
        to={RUTAS.misTickets}
        className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
      >
        <IconoFlechaIzquierda className="h-4 w-4" />
        Mis tickets
      </Link>

      <Tarjeta className="mt-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-titulo text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
            {ticket.eventName}
          </h1>
          <Badge estado={ticket.status} />
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Código
            </dt>
            <dd className="mt-1">
              <CodigoTexto>{ticket.ticketCode}</CodigoTexto>
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Tipo
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">{ticket.type}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Precio
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              {formatearCOP(ticket.price)}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Comprado el
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              {formatearFecha(ticket.purchaseDate, true)}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Evento
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              {ticket.eventName}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Titular
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              {ticket.userEmail}
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
          Presenta este código en el ingreso.
        </p>
      </Tarjeta>

      {ticket.status === 'PAID' ? (
        <div className="mt-6 flex justify-end">
          <Boton variante="peligro" onClick={abrir}>
            Cancelar ticket
          </Boton>
        </div>
      ) : null}

      <Modal abierto={confirmando} titulo="Confirmar cancelación" onCerrar={cerrar}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          ¿Seguro que deseas cancelar este ticket? Esta acción no se puede deshacer.
        </p>
        {mensaje ? (
          <div className="mt-4">
            <Aviso tipo="error" mensaje={mensaje} />
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Boton variante="secundario" onClick={cerrar}>
            Volver
          </Boton>
          <Boton variante="peligro" cargando={cancelacion.isPending} onClick={() => void cancelar()}>
            Confirmar cancelación
          </Boton>
        </div>
      </Modal>
    </Contenedor>
  )
}

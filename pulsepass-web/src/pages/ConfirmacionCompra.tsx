import { Link, useParams } from 'react-router'
import { z } from 'zod'
import Badge from '../componentes/Badge'
import Boton from '../componentes/Boton'
import Cargando from '../componentes/Cargando'
import { CodigoTexto } from '../componentes/CodigoTexto'
import EstadoError from '../componentes/EstadoError'
import { IconoCheck } from '../componentes/Iconos'
import Tarjeta from '../componentes/Tarjeta'
import { useTicket } from '../funcionalidades/tickets/hooks'
import { ContenedorEstrecho } from '../layouts/Layout'
import { formatearCOP, formatearFecha } from '../lib/formato'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'

const EsquemaCodigoTicket = z.object({
  ticketCode: z.string().min(1),
})

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos cargar el ticket.'
}

export default function ConfirmacionCompra() {
  const { ticketCode } = useParams()
  const resultado = EsquemaCodigoTicket.safeParse({ ticketCode: ticketCode ?? '' })
  const codigo = resultado.success ? resultado.data.ticketCode : ''
  const consulta = useTicket(codigo)

  if (!resultado.success) {
    return (
      <ContenedorEstrecho>
        <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100">
          Ticket no disponible
        </h1>
      </ContenedorEstrecho>
    )
  }

  if (consulta.error) {
    if (
      consulta.error instanceof ApiError &&
      (consulta.error.status === 403 || consulta.error.status === 404)
    ) {
      return (
        <ContenedorEstrecho>
          <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100">
            Ticket no disponible
          </h1>
        </ContenedorEstrecho>
      )
    }
    return (
      <ContenedorEstrecho>
        <EstadoError
          mensaje={mensajeError(consulta.error)}
          onReintentar={() => void consulta.refetch()}
        />
      </ContenedorEstrecho>
    )
  }

  if (consulta.isPending) {
    return (
      <ContenedorEstrecho>
        <Cargando etiqueta="Cargando ticket" lineas={4} />
      </ContenedorEstrecho>
    )
  }

  const ticket = consulta.data
  if (!ticket) {
    return (
      <ContenedorEstrecho>
        <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100">
          Ticket no disponible
        </h1>
      </ContenedorEstrecho>
    )
  }

  return (
    <ContenedorEstrecho className="max-w-xl">
      <Tarjeta className="p-6 text-center sm:p-8">
        <IconoCheck className="mx-auto h-14 w-14 text-emerald-600 dark:text-emerald-400" />
        <h1 className="mt-4 font-titulo text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
          ¡Compra realizada con éxito!
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Tu entrada para {ticket.eventName} está lista.
        </p>

        <dl className="mt-6 space-y-3 rounded-lg bg-slate-50 p-4 text-left dark:bg-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-sm font-semibold text-slate-500 dark:text-slate-400">Evento</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{ticket.eventName}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-sm font-semibold text-slate-500 dark:text-slate-400">Ticket</dt>
            <dd>
              <CodigoTexto>{ticket.ticketCode}</CodigoTexto>
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-sm font-semibold text-slate-500 dark:text-slate-400">Tipo</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{ticket.type}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-sm font-semibold text-slate-500 dark:text-slate-400">Precio</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {formatearCOP(ticket.price)}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-sm font-semibold text-slate-500 dark:text-slate-400">Comprado el</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {formatearFecha(ticket.purchaseDate, true)}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-sm font-semibold text-slate-500 dark:text-slate-400">Estado</dt>
            <dd>
              <Badge estado={ticket.status} />
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={RUTAS.misTickets}>
            <Boton>Ver mis tickets</Boton>
          </Link>
          <Link to={RUTAS.eventos}>
            <Boton variante="secundario">Seguir explorando</Boton>
          </Link>
        </div>
      </Tarjeta>
    </ContenedorEstrecho>
  )
}

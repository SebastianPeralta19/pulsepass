import Badge from './Badge'
import { CodigoTexto } from './CodigoTexto'
import PrecioCOP from './PrecioCOP'
import Tarjeta from './Tarjeta'
import Boton from './Boton'
import type { TicketResponse } from '../funcionalidades/tickets/tipos'
import { formatearFecha } from '../lib/formato'

export default function FichaTicketIngreso({
  ticket,
  marcando,
  alMarcar,
}: {
  ticket: TicketResponse
  marcando: boolean
  alMarcar: () => void
}) {
  return (
    <div aria-live="polite">
      <Tarjeta className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Evento
            </p>
            <h2 className="mt-1 font-titulo text-2xl font-bold text-slate-900 dark:text-slate-100">
              {ticket.eventName}
            </h2>
          </div>
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
              <PrecioCOP valor={ticket.price} />
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Compra
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              {formatearFecha(ticket.purchaseDate, true)}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Titular
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              {ticket.userEmail}
            </dd>
          </div>
        </dl>
        {ticket.status === 'PAID' ? (
          <div className="mt-6 flex justify-end">
            <Boton variante="primario" cargando={marcando} onClick={alMarcar}>
              Marcar como usado
            </Boton>
          </div>
        ) : (
          <p className="mt-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Estado actual: <Badge estado={ticket.status} />. No se permite marcar como usado.
          </p>
        )}
      </Tarjeta>
    </div>
  )
}

import Badge from './Badge'
import { CodigoTexto } from './CodigoTexto'
import Tarjeta from './Tarjeta'
import type { TicketResponse } from '../funcionalidades/tickets/tipos'
import { formatearCOP, formatearFecha } from '../lib/formato'

export default function FichaTicket({ ticket }: { ticket: TicketResponse }) {
  return (
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
  )
}

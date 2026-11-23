import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import Aviso from '../componentes/Aviso'
import Badge from '../componentes/Badge'
import Boton from '../componentes/Boton'
import Campo from '../componentes/Campo'
import Cargando from '../componentes/Cargando'
import { CodigoTexto } from '../componentes/CodigoTexto'
import EstadoError from '../componentes/EstadoError'
import EstadoVacio from '../componentes/EstadoVacio'
import PrecioCOP from '../componentes/PrecioCOP'
import Tarjeta from '../componentes/Tarjeta'
import { useTicket, useUsarTicket } from '../funcionalidades/tickets/hooks'
import { BuscarTicketSchema } from '../funcionalidades/tickets/tipos'
import type { BuscarTicketForm } from '../funcionalidades/tickets/tipos'
import { ContenedorEstrecho } from '../layouts/Layout'
import { formatearFecha } from '../lib/formato'
import { ApiError } from '../lib/http'

interface AvisoVisible {
  tipo: 'exito' | 'error'
  mensaje: string
}

function esNoDisponible(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 403 || error.status === 404)
}

function mensajeCarga(error: unknown): string {
  if (esNoDisponible(error)) return 'Ticket no disponible'
  if (error instanceof ApiError && error.status === 0) {
    return 'No pudimos conectar con el servidor.'
  }
  if (error instanceof ApiError && error.status >= 500) {
    return 'Ocurrió un error inesperado. Inténtalo más tarde.'
  }
  return error instanceof Error ? error.message : 'No pudimos cargar el ticket.'
}

function mensajeUso(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403 || error.status === 404) return 'Ticket no disponible'
    if (error.status === 409) return error.message
    if (error.status === 400) {
      return Object.values(error.details).join(' ') || error.message || 'Revisa los datos.'
    }
    if (error.status === 0) return 'No pudimos conectar con el servidor.'
    if (error.status >= 500) return 'Ocurrió un error inesperado. Inténtalo más tarde.'
    return error.message
  }
  return 'Ocurrió un error inesperado. Inténtalo más tarde.'
}

export default function ValidacionIngreso() {
  const [codigoBuscado, setCodigoBuscado] = useState('')
  const [aviso, setAviso] = useState<AvisoVisible | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BuscarTicketForm>({
    resolver: zodResolver(BuscarTicketSchema),
    defaultValues: { ticketCode: '' },
  })
  const consulta = useTicket(codigoBuscado, { enabled: codigoBuscado.length > 0 })
  const uso = useUsarTicket()
  const ticket = consulta.data

  const buscar = handleSubmit((datos) => {
    setAviso(null)
    setCodigoBuscado(datos.ticketCode)
  })

  async function marcarUsado() {
    if (!ticket) return
    setAviso(null)
    try {
      await uso.mutateAsync({ ticketCode: ticket.ticketCode, eventCode: ticket.eventCode })
      setAviso({ tipo: 'exito', mensaje: 'Ingreso registrado.' })
      reset({ ticketCode: '' })
    } catch (error) {
      setAviso({ tipo: 'error', mensaje: mensajeUso(error) })
    }
  }

  return (
    <ContenedorEstrecho>
      <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100">
        Validación de ingreso
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Consulta el código del ticket y registra el ingreso cuando esté pagado.
      </p>

      <form onSubmit={buscar} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
        <Campo
          etiqueta="Código de ticket"
          autoFocus
          autoCapitalize="characters"
          placeholder="TKT-8F2A1C"
          {...register('ticketCode')}
          error={errors.ticketCode?.message}
        />
        <div className="sm:pt-7">
          <Boton type="submit" cargando={consulta.isFetching}>
            Buscar
          </Boton>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {aviso ? <Aviso tipo={aviso.tipo} mensaje={aviso.mensaje} /> : null}

        {!codigoBuscado ? (
          <EstadoVacio mensaje="Ingresa un código de ticket para consultar." />
        ) : consulta.isPending ? (
          <Cargando etiqueta="Buscando ticket" lineas={3} />
        ) : consulta.error ? (
          esNoDisponible(consulta.error) && !aviso ? (
            <Aviso tipo="error" mensaje="Ticket no disponible" />
          ) : (
            <EstadoError
              mensaje={mensajeCarga(consulta.error)}
              onReintentar={() => void consulta.refetch()}
            />
          )
        ) : !ticket ? (
          <EstadoVacio mensaje="Ticket no disponible" />
        ) : (
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
                  <Boton
                    variante="primario"
                    cargando={uso.isPending}
                    onClick={() => void marcarUsado()}
                  >
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
        )}
      </div>
    </ContenedorEstrecho>
  )
}

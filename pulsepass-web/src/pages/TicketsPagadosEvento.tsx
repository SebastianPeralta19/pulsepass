import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { z } from 'zod'
import Aviso from '../componentes/Aviso'
import Badge from '../componentes/Badge'
import Boton from '../componentes/Boton'
import Cargando from '../componentes/Cargando'
import { CodigoTexto } from '../componentes/CodigoTexto'
import EstadoError from '../componentes/EstadoError'
import EstadoVacio from '../componentes/EstadoVacio'
import PrecioCOP from '../componentes/PrecioCOP'
import Tabla from '../componentes/Tabla'
import type { Columna } from '../componentes/Tabla'
import { useTicketsPagados } from '../funcionalidades/tickets/hooks'
import type { TicketResponse } from '../funcionalidades/tickets/tipos'
import { Contenedor } from '../layouts/Layout'
import { formatearFecha } from '../lib/formato'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'

const EsquemaCodigoEvento = z.object({
  eventCode: z.string().trim().min(1, 'Ingresa un código de evento').max(50),
})

type FormaCodigoEvento = z.infer<typeof EsquemaCodigoEvento>

const COLUMNAS: Columna<TicketResponse>[] = [
  {
    encabezado: 'Código',
    celda: (ticket) => <CodigoTexto>{ticket.ticketCode}</CodigoTexto>,
  },
  { encabezado: 'Tipo', celda: (ticket) => ticket.type },
  { encabezado: 'Precio', celda: (ticket) => <PrecioCOP valor={ticket.price} /> },
  { encabezado: 'Estado', celda: (ticket) => <Badge estado={ticket.status} /> },
  {
    encabezado: 'Compra',
    celda: (ticket) => formatearFecha(ticket.purchaseDate, true),
  },
]

function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403 || error.status === 404) return 'Evento no disponible'
    if (error.status === 0) return 'No pudimos conectar con el servidor.'
    if (error.status >= 500) return 'Ocurrió un error inesperado. Inténtalo más tarde.'
    return error.message
  }
  return 'No pudimos cargar los tickets del evento.'
}

export default function TicketsPagadosEvento() {
  const navigate = useNavigate()
  const { eventCode } = useParams()
  const validado = EsquemaCodigoEvento.safeParse({ eventCode: eventCode ?? '' })
  const codigo = validado.success ? validado.data.eventCode : ''
  const [aviso, setAviso] = useState('')
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormaCodigoEvento>({
    resolver: zodResolver(EsquemaCodigoEvento),
    defaultValues: { eventCode: codigo },
  })
  const consulta = useTicketsPagados(codigo)
  const tickets = (consulta.data ?? []).filter(
    (ticket) => ticket.status === 'PAID' || ticket.status === 'USED',
  )

  useEffect(() => {
    setValue('eventCode', codigo)
  }, [codigo, setValue])

  const ir = handleSubmit((datos) => {
    setAviso('')
    navigate(RUTAS.ticketsPagados(datos.eventCode))
  })

  return (
    <Contenedor>
      <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
        Tickets pagados
      </h1>

      <form onSubmit={ir} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
        <div className="w-full">
          <label
            htmlFor="codigo-evento"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Evento
          </label>
          <input
            id="codigo-evento"
            type="text"
            autoCapitalize="characters"
            placeholder="CMF-2026"
            aria-invalid={errors.eventCode ? true : undefined}
            aria-describedby={errors.eventCode ? 'codigo-evento-error' : undefined}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            {...register('eventCode')}
          />
          {errors.eventCode?.message ? (
            <p id="codigo-evento-error" className="mt-1 text-sm text-red-700 dark:text-red-400">
              {errors.eventCode.message}
            </p>
          ) : null}
        </div>
        <div className="sm:pt-7">
          <Boton type="submit">Ir</Boton>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {aviso ? <Aviso tipo="error" mensaje={aviso} /> : null}

        {!validado.success ? (
          <Aviso tipo="error" mensaje="El código de evento no es válido." />
        ) : consulta.isPending ? (
          <Cargando etiqueta="Cargando tickets pagados" lineas={4} />
        ) : consulta.error ? (
          <EstadoError
            mensaje={mensajeError(consulta.error)}
            onReintentar={() => void consulta.refetch()}
          />
        ) : tickets.length === 0 ? (
          <EstadoVacio mensaje="No hay tickets pagados" />
        ) : (
          <>
            <p aria-live="polite" className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total: {tickets.length}
            </p>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Tabla
                caption={`Tickets pagados del evento ${codigo}`}
                columnas={COLUMNAS}
                filas={tickets}
                claveFila={(ticket) => ticket.ticketCode}
              />
            </div>
          </>
        )}
      </div>
    </Contenedor>
  )
}

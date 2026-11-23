import { Link, useSearchParams } from 'react-router'
import { z } from 'zod'
import Badge from '../componentes/Badge'
import Boton from '../componentes/Boton'
import Cargando from '../componentes/Cargando'
import { CodigoTexto } from '../componentes/CodigoTexto'
import EstadoError from '../componentes/EstadoError'
import EstadoVacio from '../componentes/EstadoVacio'
import Tabla from '../componentes/Tabla'
import type { Columna } from '../componentes/Tabla'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import { useMisTickets } from '../funcionalidades/tickets/hooks'
import type { TicketResponse } from '../funcionalidades/tickets/tipos'
import { Contenedor } from '../layouts/Layout'
import { formatearCOP, formatearFecha } from '../lib/formato'
import { RUTAS } from '../lib/rutas'

const FiltroEstadoSchema = z.enum(['PAID', 'USED', 'CANCELLED', 'RESERVED'])

const FILTROS = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'PAID', etiqueta: 'Pagados' },
  { valor: 'USED', etiqueta: 'Usados' },
  { valor: 'CANCELLED', etiqueta: 'Cancelados' },
  { valor: 'RESERVED', etiqueta: 'Reservados' },
]

const COLUMNAS: Columna<TicketResponse>[] = [
  {
    encabezado: 'Código',
    celda: (ticket) => <CodigoTexto>{ticket.ticketCode}</CodigoTexto>,
  },
  { encabezado: 'Evento', celda: (ticket) => ticket.eventName },
  { encabezado: 'Tipo', celda: (ticket) => ticket.type },
  { encabezado: 'Precio', celda: (ticket) => formatearCOP(ticket.price) },
  { encabezado: 'Fecha', celda: (ticket) => formatearFecha(ticket.purchaseDate) },
  { encabezado: 'Estado', celda: (ticket) => <Badge estado={ticket.status} /> },
  {
    encabezado: 'Acciones',
    celda: (ticket) => (
      <Link
        to={RUTAS.detalleTicket(ticket.ticketCode)}
        className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
      >
        Ver detalle
      </Link>
    ),
  },
]

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos cargar tus tickets.'
}

export default function MisTickets() {
  const { sesion } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const email = sesion.estado === 'autenticado' ? sesion.usuario.email : ''
  const consulta = useMisTickets(email)
  const validado = FiltroEstadoSchema.optional().safeParse(searchParams.get('estado') ?? undefined)
  const estado = validado.success ? validado.data : undefined
  const tickets = consulta.data ?? []
  const filtrados = tickets.filter((ticket) => !estado || ticket.status === estado)

  function cambiarEstado(valor: string) {
    const parametros = new URLSearchParams(searchParams)
    if (FiltroEstadoSchema.safeParse(valor).success) parametros.set('estado', valor)
    else parametros.delete('estado')
    setSearchParams(parametros)
  }

  return (
    <Contenedor>
      <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
        Mis tickets
      </h1>

      <div
        role="group"
        aria-label="Filtrar tickets por estado"
        className="mt-6 flex flex-wrap gap-2"
      >
        {FILTROS.map((filtro) => (
          <Boton
            key={filtro.valor}
            variante={estado === filtro.valor || (!estado && !filtro.valor) ? 'primario' : 'secundario'}
            aria-pressed={estado === filtro.valor || (!estado && !filtro.valor)}
            onClick={() => cambiarEstado(filtro.valor)}
          >
            {filtro.etiqueta}
          </Boton>
        ))}
      </div>

      <p aria-live="polite" className="mt-6 text-sm font-medium text-slate-600 dark:text-slate-400">
        {filtrados.length} tickets
      </p>

      <div className="mt-4">
        {!email ? (
          <EstadoVacio
            mensaje="Inicia sesión para ver tus tickets."
            accion={
              <Link
                to={RUTAS.login}
                className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
              >
                Iniciar sesión
              </Link>
            }
          />
        ) : consulta.isPending ? (
          <Cargando etiqueta="Cargando tickets" lineas={4} />
        ) : consulta.error ? (
          <EstadoError
            mensaje={mensajeError(consulta.error)}
            onReintentar={() => void consulta.refetch()}
          />
        ) : tickets.length === 0 ? (
          <EstadoVacio
            mensaje="Aún no tienes tickets"
            accion={
              <Link
                to={RUTAS.eventos}
                className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
              >
                Explorar eventos
              </Link>
            }
          />
        ) : filtrados.length === 0 ? (
          <EstadoVacio
            mensaje="No hay tickets con este estado"
            accion={
              <Boton variante="secundario" onClick={() => cambiarEstado('')}>
                Ver todos
              </Boton>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Tabla
              caption="Tickets del usuario"
              columnas={COLUMNAS}
              filas={filtrados}
              claveFila={(ticket) => ticket.ticketCode}
            />
          </div>
        )}
      </div>
    </Contenedor>
  )
}

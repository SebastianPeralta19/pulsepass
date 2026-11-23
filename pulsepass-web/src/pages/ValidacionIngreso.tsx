import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import Aviso from '../componentes/Aviso'
import Cargando from '../componentes/Cargando'
import EstadoError from '../componentes/EstadoError'
import EstadoVacio from '../componentes/EstadoVacio'
import FichaTicketIngreso from '../componentes/FichaTicketIngreso'
import FormularioBusquedaTicket from '../componentes/FormularioBusquedaTicket'
import {
  esTicketNoDisponible,
  mensajeCargaIngreso,
  mensajeUsoTicket,
} from '../componentes/ErroresTicket'
import { useTicket, useUsarTicket } from '../funcionalidades/tickets/hooks'
import { BuscarTicketSchema } from '../funcionalidades/tickets/tipos'
import type { BuscarTicketForm } from '../funcionalidades/tickets/tipos'
import { ContenedorEstrecho } from '../layouts/Layout'

interface AvisoVisible {
  tipo: 'exito' | 'error'
  mensaje: string
}

export default function ValidacionIngreso() {
  const [codigoBuscado, setCodigoBuscado] = useState('')
  const [aviso, setAviso] = useState<AvisoVisible | null>(null)
  const form = useForm<BuscarTicketForm>({
    resolver: zodResolver(BuscarTicketSchema),
    defaultValues: { ticketCode: '' },
  })
  const consulta = useTicket(codigoBuscado, { enabled: codigoBuscado.length > 0 })
  const uso = useUsarTicket()
  const ticket = consulta.data

  const buscar = form.handleSubmit((datos) => {
    setAviso(null)
    setCodigoBuscado(datos.ticketCode)
  })

  async function marcarUsado() {
    if (!ticket) return
    setAviso(null)
    try {
      await uso.mutateAsync({ ticketCode: ticket.ticketCode, eventCode: ticket.eventCode })
      setAviso({ tipo: 'exito', mensaje: 'Ingreso registrado.' })
      form.reset({ ticketCode: '' })
    } catch (error) {
      setAviso({ tipo: 'error', mensaje: mensajeUsoTicket(error) })
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
      <FormularioBusquedaTicket form={form} onBuscar={buscar} cargando={consulta.isFetching} />
      <div className="mt-6 space-y-4">
        {aviso ? <Aviso tipo={aviso.tipo} mensaje={aviso.mensaje} /> : null}
        {!codigoBuscado ? (
          <EstadoVacio mensaje="Ingresa un código de ticket para consultar." />
        ) : consulta.isPending ? (
          <Cargando etiqueta="Buscando ticket" lineas={3} />
        ) : consulta.error ? (
          esTicketNoDisponible(consulta.error) && !aviso ? (
            <Aviso tipo="error" mensaje="Ticket no disponible" />
          ) : (
            <EstadoError
              mensaje={mensajeCargaIngreso(consulta.error)}
              onReintentar={() => void consulta.refetch()}
            />
          )
        ) : !ticket ? (
          <EstadoVacio mensaje="Ticket no disponible" />
        ) : (
          <FichaTicketIngreso
            ticket={ticket}
            marcando={uso.isPending}
            alMarcar={() => void marcarUsado()}
          />
        )}
      </div>
    </ContenedorEstrecho>
  )
}

import type { FormEventHandler } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import Boton from './Boton'
import Campo from './Campo'
import type { BuscarTicketForm } from '../funcionalidades/tickets/tipos'

export default function FormularioBusquedaTicket({
  form,
  onBuscar,
  cargando,
}: {
  form: UseFormReturn<BuscarTicketForm>
  onBuscar: FormEventHandler<HTMLFormElement>
  cargando: boolean
}) {
  const { register, formState } = form
  return (
    <form onSubmit={onBuscar} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
      <Campo
        etiqueta="Código de ticket"
        autoFocus
        autoCapitalize="characters"
        placeholder="TKT-8F2A1C"
        {...register('ticketCode')}
        error={formState.errors.ticketCode?.message}
      />
      <div className="sm:pt-7">
        <Boton type="submit" cargando={cargando}>
          Buscar
        </Boton>
      </div>
    </form>
  )
}

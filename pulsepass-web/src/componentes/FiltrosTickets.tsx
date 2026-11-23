import Boton from './Boton'
import type { TicketStatus } from '../funcionalidades/tickets/tipos'

const FILTROS: { valor: TicketStatus | ''; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'PAID', etiqueta: 'Pagados' },
  { valor: 'USED', etiqueta: 'Usados' },
  { valor: 'CANCELLED', etiqueta: 'Cancelados' },
  { valor: 'RESERVED', etiqueta: 'Reservados' },
]

export default function FiltrosTickets({
  estado,
  onCambiar,
}: {
  estado: string | undefined
  onCambiar: (valor: string) => void
}) {
  return (
    <div role="group" aria-label="Filtrar tickets por estado" className="mt-6 flex flex-wrap gap-2">
      {FILTROS.map((filtro) => (
        <Boton
          key={filtro.valor}
          variante={estado === filtro.valor || (!estado && !filtro.valor) ? 'primario' : 'secundario'}
          aria-pressed={estado === filtro.valor || (!estado && !filtro.valor)}
          onClick={() => onCambiar(filtro.valor)}
        >
          {filtro.etiqueta}
        </Boton>
      ))}
    </div>
  )
}

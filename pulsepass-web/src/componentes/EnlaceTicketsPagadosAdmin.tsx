import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'

export default function EnlaceTicketsPagadosAdmin({ eventCode }: { eventCode: string }) {
  return (
    <p className="mt-6 text-sm">
      <Link
        to={RUTAS.ticketsPagados(eventCode)}
        className="font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
      >
        Ver tickets pagados del evento
      </Link>
    </p>
  )
}

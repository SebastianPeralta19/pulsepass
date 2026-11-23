import { NavLink } from 'react-router'
import clsx from 'clsx'
import { EVENTO_DEMO, RUTAS } from '../lib/rutas'

export function enlaceActivo({ isActive }: { isActive: boolean }) {
  return clsx(
    'rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-marca-600',
    isActive
      ? 'bg-marca-50 text-marca-700 dark:bg-slate-800 dark:text-marca-500'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
  )
}

export default function EnlacesNavegacion({
  esUser,
  esStaff,
  esAdmin,
  movil = false,
  alNavegar,
}: {
  esUser: boolean
  esStaff: boolean
  esAdmin: boolean
  movil?: boolean
  alNavegar?: () => void
}) {
  return (
    <>
      <NavLink end to={RUTAS.inicio} className={enlaceActivo} onClick={alNavegar}>
        Inicio
      </NavLink>
      <NavLink to={RUTAS.eventos} className={enlaceActivo} onClick={alNavegar}>
        Eventos
      </NavLink>
      <NavLink to={RUTAS.artistas} className={enlaceActivo} onClick={alNavegar}>
        Artistas
      </NavLink>
      <NavLink to={RUTAS.sedes} className={enlaceActivo} onClick={alNavegar}>
        Sedes
      </NavLink>
      {esUser ? (
        <NavLink to={RUTAS.misTickets} className={enlaceActivo} onClick={alNavegar}>
          Mis tickets
        </NavLink>
      ) : null}
      {esStaff ? (
        <>
          <NavLink to={RUTAS.validacionIngreso} className={enlaceActivo} onClick={alNavegar}>
            Validar ingreso
          </NavLink>
          {movil ? null : (
            <NavLink to={RUTAS.ticketsPagados(EVENTO_DEMO)} className={enlaceActivo}>
              Tickets pagados
            </NavLink>
          )}
        </>
      ) : null}
      {esAdmin ? (
        <NavLink to={RUTAS.adminEventos} className={enlaceActivo} onClick={alNavegar}>
          Administrar eventos
        </NavLink>
      ) : null}
    </>
  )
}

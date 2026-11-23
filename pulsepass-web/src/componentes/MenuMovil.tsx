import type { RefObject } from 'react'
import { Link } from 'react-router'
import clsx from 'clsx'
import Boton from './Boton'
import EnlacesNavegacion, { enlaceActivo } from './EnlacesNavegacion'
import { RUTAS } from '../lib/rutas'

export default function MenuMovil({
  menuRef,
  autenticado,
  esUser,
  esStaff,
  esAdmin,
  alCerrar,
  alSalir,
}: {
  menuRef: RefObject<HTMLDivElement | null>
  autenticado: boolean
  esUser: boolean
  esStaff: boolean
  esAdmin: boolean
  alCerrar: () => void
  alSalir: () => void
}) {
  return (
    <div
      id="menu-movil"
      ref={menuRef}
      className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 md:hidden"
    >
      <div className="flex flex-col gap-1">
        <EnlacesNavegacion
          esUser={esUser}
          esStaff={esStaff}
          esAdmin={esAdmin}
          movil
          alNavegar={alCerrar}
        />
        <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
        {autenticado ? (
          <>
            <Link to={RUTAS.cuenta} className={enlaceActivo({ isActive: false })} onClick={alCerrar}>
              Mi cuenta
            </Link>
            <button
              type="button"
              onClick={alSalir}
              className={clsx(enlaceActivo({ isActive: false }), 'text-left')}
            >
              Salir
            </button>
          </>
        ) : (
          <div className="flex gap-2 pt-2">
            <Link to={RUTAS.login} onClick={alCerrar}>
              <Boton variante="secundario">Ingresar</Boton>
            </Link>
            <Link to={RUTAS.registro} onClick={alCerrar}>
              <Boton>Registrarse</Boton>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

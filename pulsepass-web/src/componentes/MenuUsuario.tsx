import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import clsx from 'clsx'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import { RUTAS } from '../lib/rutas'
import { enlaceActivo } from './EnlacesNavegacion'

export default function MenuUsuario() {
  const { sesion, cerrarSesion } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const navigate = useNavigate()
  const boton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!abierto) return
    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setAbierto(false)
        boton.current?.focus()
      }
    }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [abierto])

  if (sesion.estado !== 'autenticado') return null
  const inicial = sesion.usuario.username.charAt(0).toUpperCase() || 'U'

  function salir() {
    setAbierto(false)
    cerrarSesion()
    navigate(RUTAS.inicio)
  }

  return (
    <div className="relative">
      <button
        ref={boton}
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((valor) => !valor)}
        className="flex min-h-11 items-center gap-2 rounded-full bg-marca-50 px-2 py-1 text-sm font-semibold text-marca-700 focus-visible:outline-2 focus-visible:outline-marca-600 dark:bg-slate-800 dark:text-marca-500"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-marca-600 text-white"
        >
          {inicial}
        </span>
        {sesion.usuario.username}
        <span aria-hidden="true">▾</span>
      </button>
      {abierto ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <Link role="menuitem" to={RUTAS.cuenta} className={enlaceActivo({ isActive: false })} onClick={() => setAbierto(false)}>
            Mi cuenta
          </Link>
          {sesion.usuario.roles.includes('USER') ? (
            <Link
              role="menuitem"
              to={RUTAS.misTickets}
              className={enlaceActivo({ isActive: false })}
              onClick={() => setAbierto(false)}
            >
              Mis tickets
            </Link>
          ) : null}
          <button
            role="menuitem"
            type="button"
            onClick={salir}
            className={clsx(enlaceActivo({ isActive: false }), 'w-full text-left')}
          >
            Salir
          </button>
        </div>
      ) : null}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import clsx from 'clsx'
import { RUTAS, EVENTO_DEMO } from '../lib/rutas'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import Boton from '../componentes/Boton'
import { IconoMenu, IconoCerrar, IconoSol, IconoLuna, IconoMusica } from '../componentes/Iconos'

export function Contenedor({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('mx-auto w-full max-w-6xl px-4 py-8', className)}>{children}</div>
}

export function ContenedorEstrecho({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={clsx('mx-auto w-full max-w-3xl px-4 py-8', className)}>{children}</div>
}

function enlaceActivo({ isActive }: { isActive: boolean }) {
  return clsx(
    'rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-marca-600',
    isActive
      ? 'bg-marca-50 text-marca-700 dark:bg-slate-800 dark:text-marca-500'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
  )
}

function MenuUsuario() {
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

export default function Layout() {
  const { sesion, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [oscuro, setOscuro] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const menu = useRef<HTMLDivElement>(null)
  const botonMenu = useRef<HTMLButtonElement>(null)
  const autenticado = sesion.estado === 'autenticado'
  const roles = autenticado ? sesion.usuario.roles : []
  const esUser = roles.includes('USER')
  const esStaff = roles.includes('STAFF') || roles.includes('ADMIN')
  const esAdmin = roles.includes('ADMIN')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro)
  }, [oscuro])

  useEffect(() => {
    if (!menuAbierto) return
    const primerEnlace = menu.current?.querySelector<HTMLAnchorElement>('a')
    primerEnlace?.focus()
    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setMenuAbierto(false)
        botonMenu.current?.focus()
      }
    }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [menuAbierto])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-marca-700"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <nav aria-label="Principal" className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <Link to={RUTAS.inicio} className="mr-auto flex items-center gap-2 font-titulo text-lg font-bold text-marca-700 dark:text-marca-500">
            <IconoMusica className="h-6 w-6" />
            PulsePass
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <NavLink end to={RUTAS.inicio} className={enlaceActivo}>
              Inicio
            </NavLink>
            <NavLink to={RUTAS.eventos} className={enlaceActivo}>
              Eventos
            </NavLink>
            <NavLink to={RUTAS.artistas} className={enlaceActivo}>
              Artistas
            </NavLink>
            <NavLink to={RUTAS.sedes} className={enlaceActivo}>
              Sedes
            </NavLink>
            {esUser ? (
              <NavLink to={RUTAS.misTickets} className={enlaceActivo}>
                Mis tickets
              </NavLink>
            ) : null}
            {esStaff ? (
              <>
                <NavLink to={RUTAS.validacionIngreso} className={enlaceActivo}>
                  Validar ingreso
                </NavLink>
                <NavLink to={RUTAS.ticketsPagados(EVENTO_DEMO)} className={enlaceActivo}>
                  Tickets pagados
                </NavLink>
              </>
            ) : null}
            {esAdmin ? (
              <NavLink to={RUTAS.adminEventos} className={enlaceActivo}>
                Administrar eventos
              </NavLink>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setOscuro((valor) => !valor)}
            aria-label={oscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
            className="ml-2 rounded-lg p-2 text-slate-600 focus-visible:outline-2 focus-visible:outline-marca-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {oscuro ? <IconoSol className="h-5 w-5" /> : <IconoLuna className="h-5 w-5" />}
          </button>
          <div className="hidden md:block">
            {autenticado ? (
              <MenuUsuario />
            ) : (
              <div className="flex gap-2">
                <Link to={RUTAS.login}>
                  <Boton variante="fantasma">Ingresar</Boton>
                </Link>
                <Link to={RUTAS.registro}>
                  <Boton>Registrarse</Boton>
                </Link>
              </div>
            )}
          </div>
          <button
            ref={botonMenu}
            type="button"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            onClick={() => setMenuAbierto((valor) => !valor)}
            className="ml-1 rounded-lg p-2 text-slate-700 focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-slate-200 md:hidden"
          >
            {menuAbierto ? <IconoCerrar className="h-6 w-6" /> : <IconoMenu className="h-6 w-6" />}
          </button>
        </nav>
        {menuAbierto ? (
          <div id="menu-movil" ref={menu} className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 md:hidden">
            <div className="flex flex-col gap-1">
              <NavLink end to={RUTAS.inicio} className={enlaceActivo} onClick={() => setMenuAbierto(false)}>
                Inicio
              </NavLink>
              <NavLink to={RUTAS.eventos} className={enlaceActivo} onClick={() => setMenuAbierto(false)}>
                Eventos
              </NavLink>
              <NavLink to={RUTAS.artistas} className={enlaceActivo} onClick={() => setMenuAbierto(false)}>
                Artistas
              </NavLink>
              <NavLink to={RUTAS.sedes} className={enlaceActivo} onClick={() => setMenuAbierto(false)}>
                Sedes
              </NavLink>
              {esUser ? (
                <NavLink to={RUTAS.misTickets} className={enlaceActivo} onClick={() => setMenuAbierto(false)}>
                  Mis tickets
                </NavLink>
              ) : null}
              {esStaff ? (
                <NavLink to={RUTAS.validacionIngreso} className={enlaceActivo} onClick={() => setMenuAbierto(false)}>
                  Validar ingreso
                </NavLink>
              ) : null}
              {esAdmin ? (
                <NavLink to={RUTAS.adminEventos} className={enlaceActivo} onClick={() => setMenuAbierto(false)}>
                  Administrar eventos
                </NavLink>
              ) : null}
              <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
              {autenticado ? (
                <>
                  <Link to={RUTAS.cuenta} className={enlaceActivo({ isActive: false })} onClick={() => setMenuAbierto(false)}>
                    Mi cuenta
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAbierto(false)
                      cerrarSesion()
                      navigate(RUTAS.inicio)
                    }}
                    className={clsx(enlaceActivo({ isActive: false }), 'text-left')}
                  >
                    Salir
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to={RUTAS.login} onClick={() => setMenuAbierto(false)}>
                    <Boton variante="secundario">Ingresar</Boton>
                  </Link>
                  <Link to={RUTAS.registro} onClick={() => setMenuAbierto(false)}>
                    <Boton>Registrarse</Boton>
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </header>
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 PulsePass · Caso de estudio académico</p>
          <div className="flex gap-4">
            <Link to={RUTAS.sedes} className="hover:text-marca-700 dark:hover:text-marca-500">
              Sedes
            </Link>
            <Link to={RUTAS.artistas} className="hover:text-marca-700 dark:hover:text-marca-500">
              Artistas
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

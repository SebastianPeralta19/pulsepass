import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, Outlet, useNavigate } from 'react-router'
import clsx from 'clsx'
import Boton from '../componentes/Boton'
import EnlacesNavegacion from '../componentes/EnlacesNavegacion'
import { IconoMenu, IconoCerrar, IconoSol, IconoLuna, IconoMusica } from '../componentes/Iconos'
import MenuMovil from '../componentes/MenuMovil'
import MenuUsuario from '../componentes/MenuUsuario'
import PiePagina from '../componentes/PiePagina'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import { RUTAS } from '../lib/rutas'

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

export default function Layout() {
  const { sesion, cerrarSesion, registrarNavegador } = useAuth()
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
    registrarNavegador(navigate)
    return () => registrarNavegador(null)
  }, [navigate, registrarNavegador])

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

  function salirMovil() {
    setMenuAbierto(false)
    cerrarSesion()
    navigate(RUTAS.inicio)
  }

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
            <EnlacesNavegacion esUser={esUser} esStaff={esStaff} esAdmin={esAdmin} />
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
          <MenuMovil
            menuRef={menu}
            autenticado={autenticado}
            esUser={esUser}
            esStaff={esStaff}
            esAdmin={esAdmin}
            alCerrar={() => setMenuAbierto(false)}
            alSalir={salirMovil}
          />
        ) : null}
      </header>
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      <PiePagina />
    </div>
  )
}

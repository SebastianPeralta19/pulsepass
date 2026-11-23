import type { ComponentProps } from 'react'
import { Link } from 'react-router'
import Badge from '../componentes/Badge'
import Boton from '../componentes/Boton'
import Cargando from '../componentes/Cargando'
import EstadoError from '../componentes/EstadoError'
import { Contenedor } from '../layouts/Layout'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import { useSesion } from '../funcionalidades/auth/hooks'
import type { Rol } from '../funcionalidades/auth/tipos'
import { useUsuarioPorEmail } from '../funcionalidades/usuarios/hooks'
import { formatearFecha } from '../lib/formato'
import { RUTAS } from '../lib/rutas'

type EstadoBadge = ComponentProps<typeof Badge>['estado']

function BadgeRol({ rol }: { rol: Rol }) {
  return (
    <Badge
      estado={rol as unknown as EstadoBadge}
      className="bg-marca-100 text-marca-800 dark:bg-slate-800 dark:text-marca-500"
    />
  )
}

export default function Cuenta() {
  const sesion = useSesion()
  const { cerrarSesion } = useAuth()
  const correo = sesion.estado === 'autenticado' ? sesion.usuario.email : ''
  const consulta = useUsuarioPorEmail(correo)

  if (sesion.estado !== 'autenticado') return null

  const { usuario } = sesion
  const perfil = consulta.data
  const nombre = perfil ? `${perfil.firstName} ${perfil.lastName}`.trim() : usuario.username

  return (
    <Contenedor>
      <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100">
        Mi cuenta
      </h1>
      <section
        aria-label="Resumen de la cuenta"
        className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-marca-600 text-lg font-bold text-white"
          >
            {usuario.username.charAt(0).toUpperCase() || 'U'}
          </span>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{nombre}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">@{usuario.username}</p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
              Correo electrónico (solo lectura): <span className="font-medium">{usuario.email}</span>
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Estado: {usuario.active ? 'Activa' : 'Inactiva'}
            </p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Roles</p>
          <div className="flex flex-wrap gap-2">
            {usuario.roles.map((rol) => (
              <BadgeRol key={rol} rol={rol} />
            ))}
          </div>
        </div>
      </section>

      {consulta.isPending ? (
        <Cargando etiqueta="Cargando perfil" lineas={3} />
      ) : consulta.isError ? (
        <div className="mt-6">
          <EstadoError
            mensaje="No pudimos cargar tu perfil."
            onReintentar={() => {
              void consulta.refetch()
            }}
          />
        </div>
      ) : perfil ? (
        <section
          aria-label="Perfil"
          className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Datos personales
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Nombre</dt>
              <dd className="text-slate-800 dark:text-slate-100">{perfil.firstName}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Apellido</dt>
              <dd className="text-slate-800 dark:text-slate-100">{perfil.lastName}</dd>
            </div>
            {perfil.phone ? (
              <div>
                <dt className="text-sm text-slate-500 dark:text-slate-400">Teléfono</dt>
                <dd className="text-slate-800 dark:text-slate-100">{perfil.phone}</dd>
              </div>
            ) : null}
            {perfil.city ? (
              <div>
                <dt className="text-sm text-slate-500 dark:text-slate-400">Ciudad</dt>
                <dd className="text-slate-800 dark:text-slate-100">{perfil.city}</dd>
              </div>
            ) : null}
            {perfil.birthDate ? (
              <div>
                <dt className="text-sm text-slate-500 dark:text-slate-400">Nacimiento</dt>
                <dd className="text-slate-800 dark:text-slate-100">
                  {formatearFecha(perfil.birthDate)}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {usuario.roles.includes('USER') ? (
          <Link to={RUTAS.misTickets}>
            <Boton variante="secundario">Ver mis tickets</Boton>
          </Link>
        ) : null}
        <Boton variante="peligro" onClick={() => cerrarSesion()}>
          Cerrar sesión
        </Boton>
      </div>
    </Contenedor>
  )
}

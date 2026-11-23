import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import Aviso from '../componentes/Aviso'
import Boton from '../componentes/Boton'
import Campo from '../componentes/Campo'
import { IconoOjo, IconoOjoCerrado } from '../componentes/Iconos'
import { ContenedorEstrecho } from '../layouts/Layout'
import { useRegistrarUsuario } from '../funcionalidades/usuarios/hooks'
import { RegistroUsuarioSchema, fortalezaPassword } from '../funcionalidades/usuarios/tipos'
import type { RegistroUsuarioForm } from '../funcionalidades/usuarios/tipos'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'

const EsquemaRegistro = RegistroUsuarioSchema.extend({
  confirmacion: z.string().min(1, 'Confirma tu contraseña'),
}).refine((datos) => datos.password === datos.confirmacion, {
  path: ['confirmacion'],
  message: 'Las contraseñas no coinciden',
})

type RegistroForm = z.infer<typeof EsquemaRegistro>

const CAMPOS: readonly (keyof RegistroForm)[] = [
  'username',
  'email',
  'firstName',
  'lastName',
  'birthDate',
  'password',
  'confirmacion',
]

export default function Registro() {
  const navigate = useNavigate()
  const mutacion = useRegistrarUsuario()
  const [aviso, setAviso] = useState('')
  const [visible, setVisible] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegistroForm>({
    resolver: zodResolver(EsquemaRegistro),
    defaultValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      birthDate: '',
      password: '',
      confirmacion: '',
    },
  })
  const password = useWatch({ control, name: 'password' }) ?? ''
  const fuerza = fortalezaPassword(password)
  const niveles = Math.ceil(fuerza.porcentaje / 25)

  const enviar = handleSubmit(async (datos) => {
    setAviso('')
    const usuario: RegistroUsuarioForm = {
      username: datos.username,
      email: datos.email,
      firstName: datos.firstName,
      lastName: datos.lastName,
      birthDate: datos.birthDate,
      password: datos.password,
    }
    try {
      await mutacion.mutateAsync(usuario)
      navigate(RUTAS.login, { state: { registrado: true } })
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setAviso('Inténtalo más tarde.')
        return
      }
      if (error.status === 409) {
        setAviso('El usuario o correo ya está registrado')
        return
      }
      if (error.status === 400) {
        const pendientes: string[] = []
        let asignado = false
        for (const [clave, mensaje] of Object.entries(error.details)) {
          const campo = CAMPOS.find((nombre) => nombre === clave)
          if (campo) {
            setError(campo, { message: mensaje })
            asignado = true
          } else {
            pendientes.push(mensaje)
          }
        }
        setAviso(
          pendientes.join(' ') ||
            (asignado ? '' : error.message || 'Revisa los datos del formulario.'),
        )
        return
      }
      setAviso(
        error.status === 0
          ? 'No pudimos conectar con el servidor. Inténtalo más tarde.'
          : error.status >= 500
            ? 'Ocurrió un error inesperado. Inténtalo más tarde.'
            : error.message,
      )
    }
  })

  return (
    <ContenedorEstrecho className="max-w-xl">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100">
          Crea tu cuenta
        </h1>
        {aviso ? (
          <div className="mt-4">
            <Aviso tipo="error" mensaje={aviso} />
          </div>
        ) : null}
        <form onSubmit={enviar} className="mt-6 space-y-4" noValidate>
          <Campo
            etiqueta="Nombre de usuario"
            autoComplete="username"
            autoCapitalize="none"
            {...register('username')}
            error={errors.username?.message}
          />
          <Campo
            etiqueta="Correo electrónico"
            type="email"
            autoComplete="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Nombres"
              autoComplete="given-name"
              {...register('firstName')}
              error={errors.firstName?.message}
            />
            <Campo
              etiqueta="Apellidos"
              autoComplete="family-name"
              {...register('lastName')}
              error={errors.lastName?.message}
            />
          </div>
          <Campo
            etiqueta="Fecha de nacimiento"
            type="date"
            autoComplete="bday"
            {...register('birthDate')}
            error={errors.birthDate?.message}
          />
          <div>
            <div className="relative">
              <Campo
                etiqueta="Contraseña (mín. 12)"
                type={visible ? 'text' : 'password'}
                autoComplete="new-password"
                className="pr-12"
                {...register('password')}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setVisible((valor) => !valor)}
                aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={visible}
                className="absolute right-2 top-9 rounded-md p-2 text-slate-600 focus-visible:outline-2 focus-visible:outline-marca-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {visible ? (
                  <IconoOjoCerrado className="h-5 w-5" />
                ) : (
                  <IconoOjo className="h-5 w-5" />
                )}
              </button>
            </div>
            <div
              role="meter"
              aria-label="Fortaleza de la contraseña"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={fuerza.porcentaje}
              aria-valuetext={fuerza.texto}
              className="mt-2 flex gap-1"
            >
              {[1, 2, 3, 4].map((nivel) => (
                <span
                  key={nivel}
                  aria-hidden="true"
                  className={`h-2 flex-1 rounded ${
                    nivel <= niveles
                      ? 'bg-marca-600 dark:bg-marca-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Fortaleza: {fuerza.texto}
            </p>
          </div>
          <Campo
            etiqueta="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            {...register('confirmacion')}
            error={errors.confirmacion?.message}
          />
          <Boton type="submit" cargando={mutacion.isPending} className="w-full">
            Crear cuenta
          </Boton>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          ¿Ya tienes cuenta?{' '}
          <Link to={RUTAS.login} className="font-semibold text-marca-700 hover:underline dark:text-marca-500">
            Inicia sesión
          </Link>
        </p>
      </div>
    </ContenedorEstrecho>
  )
}

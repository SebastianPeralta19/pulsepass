import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router'
import Aviso from '../componentes/Aviso'
import Boton from '../componentes/Boton'
import Campo from '../componentes/Campo'
import ContrasenaVisible from '../componentes/ContrasenaVisible'
import EnlaceRegistroLogin from '../componentes/EnlaceRegistroLogin'
import { ContenedorEstrecho } from '../layouts/Layout'
import { useAuth } from '../funcionalidades/auth/AuthContext'
import { useLogin } from '../funcionalidades/auth/hooks'
import { LoginRequestSchema } from '../funcionalidades/auth/tipos'
import type { LoginRequest } from '../funcionalidades/auth/tipos'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'

interface EstadoLogin {
  motivo?: 'expirada'
  desde?: string
  registrado?: boolean
}

const CAMPOS: readonly (keyof LoginRequest)[] = ['identifier', 'password']

function leerEstado(valor: unknown): EstadoLogin {
  if (typeof valor !== 'object' || valor === null) return {}
  const dato = valor as Partial<EstadoLogin>
  return {
    motivo: dato.motivo === 'expirada' ? 'expirada' : undefined,
    desde: typeof dato.desde === 'string' ? dato.desde : undefined,
    registrado: dato.registrado === true,
  }
}

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sesionExpirada } = useAuth()
  const mutacion = useLogin()
  const [aviso, setAviso] = useState('')
  const [visible, setVisible] = useState(false)
  const estado = leerEstado(location.state)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const enviar = handleSubmit(async (datos) => {
    setAviso('')
    try {
      await mutacion.mutateAsync(datos)
      const desde =
        estado.desde && estado.desde.startsWith('/') && !estado.desde.startsWith('//')
          ? estado.desde
          : RUTAS.inicio
      navigate(desde, { replace: true })
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setAviso('Inténtalo más tarde.')
        return
      }
      if (error.status === 401) {
        setAviso('Credenciales inválidas')
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

  const mensaje =
    aviso ||
    (estado.motivo === 'expirada' || sesionExpirada
      ? 'Tu sesión expiró'
      : estado.registrado
        ? 'Cuenta creada. Inicia sesión.'
        : '')

  return (
    <ContenedorEstrecho className="max-w-md">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100">
          Inicia sesión
        </h1>
        {mensaje ? (
          <div className="mt-4" aria-live="polite">
            <Aviso tipo={aviso ? 'error' : 'info'} mensaje={mensaje} />
          </div>
        ) : null}
        <form onSubmit={enviar} className="mt-6 space-y-4" noValidate>
          <Campo
            etiqueta="Usuario o correo"
            autoComplete="username"
            autoCapitalize="none"
            {...register('identifier')}
            error={errors.identifier?.message}
          />
          <ContrasenaVisible
            visible={visible}
            alAlternar={() => setVisible((valor) => !valor)}
          >
            <Campo
              etiqueta="Contraseña"
              type={visible ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-12"
              {...register('password')}
              error={errors.password?.message}
            />
          </ContrasenaVisible>
          <Boton type="submit" cargando={mutacion.isPending} className="w-full">
            Ingresar
          </Boton>
        </form>
        <EnlaceRegistroLogin />
      </div>
    </ContenedorEstrecho>
  )
}

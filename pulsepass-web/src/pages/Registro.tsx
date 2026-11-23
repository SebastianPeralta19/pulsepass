import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import Aviso from '../componentes/Aviso'
import FormularioRegistro, {
  CAMPOS_REGISTRO,
  EsquemaRegistro,
} from '../componentes/FormularioRegistro'
import type { RegistroForm } from '../componentes/FormularioRegistro'
import { useRegistrarUsuario } from '../funcionalidades/usuarios/hooks'
import { fortalezaPassword } from '../funcionalidades/usuarios/tipos'
import type { RegistroUsuarioForm } from '../funcionalidades/usuarios/tipos'
import { ContenedorEstrecho } from '../layouts/Layout'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'

export default function Registro() {
  const navigate = useNavigate()
  const mutacion = useRegistrarUsuario()
  const [aviso, setAviso] = useState('')
  const [visible, setVisible] = useState(false)
  const form = useForm<RegistroForm>({
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
  const password = useWatch({ control: form.control, name: 'password' }) ?? ''
  const fuerza = fortalezaPassword(password)

  const enviar = form.handleSubmit(async (datos) => {
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
          const campo = CAMPOS_REGISTRO.find((nombre) => nombre === clave)
          if (campo) {
            form.setError(campo, { message: mensaje })
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
        <FormularioRegistro
          form={form}
          onEnviar={enviar}
          fuerza={fuerza}
          visible={visible}
          alAlternar={() => setVisible((valor) => !valor)}
          cargando={mutacion.isPending}
        />
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

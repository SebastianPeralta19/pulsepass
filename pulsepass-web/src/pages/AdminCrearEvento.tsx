import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import Aviso from '../componentes/Aviso'
import FormularioEvento, {
  CAMPOS_FORMULARIO_EVENTO,
  FormularioEventoSchema,
} from '../componentes/FormularioEvento'
import type { DatosFormularioEvento } from '../componentes/FormularioEvento'
import { useCreados } from '../funcionalidades/eventos/CreadosContext'
import { useCrearEvento } from '../funcionalidades/eventos/hooks'
import { useSedesActivas } from '../funcionalidades/sedes/hooks'
import { ContenedorEstrecho } from '../layouts/Layout'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'

function minActual(): string {
  const ahora = new Date()
  const dos = (numero: number) => String(numero).padStart(2, '0')
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}T${dos(ahora.getHours())}:${dos(ahora.getMinutes())}`
}

export default function AdminCrearEvento() {
  const navigate = useNavigate()
  const mutacion = useCrearEvento()
  const consultaSedes = useSedesActivas()
  const { agregar } = useCreados()
  const [aviso, setAviso] = useState('')
  const form = useForm<DatosFormularioEvento>({
    resolver: zodResolver(FormularioEventoSchema),
    defaultValues: {
      eventCode: '',
      name: '',
      description: '',
      category: 'MUSIC',
      eventDate: '',
      minimumAge: 0,
      venueCode: '',
    },
  })
  const descripcion = useWatch({ control: form.control, name: 'description' }) ?? ''
  const sedes = consultaSedes.data ?? []
  const opcionesSedes = sedes.map((sede) => ({
    valor: sede.code,
    etiqueta: `${sede.name} (${sede.code})`,
  }))

  const enviar = form.handleSubmit(async (datos) => {
    setAviso('')
    form.clearErrors()
    try {
      const respuesta = await mutacion.mutateAsync(datos)
      agregar(respuesta.eventCode)
      navigate(RUTAS.adminGestionEvento(respuesta.eventCode))
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setAviso('Inténtalo más tarde.')
        return
      }
      if (error.status === 403) {
        navigate(RUTAS.sinPermisos)
        return
      }
      if (error.status === 400) {
        const pendientes: string[] = []
        let asignado = false
        for (const [clave, mensaje] of Object.entries(error.details)) {
          const campo = CAMPOS_FORMULARIO_EVENTO.find((nombre) => nombre === clave)
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
      if (error.status === 409) {
        setAviso(error.message || 'Ya existe un evento con esos datos.')
        return
      }
      if (error.status === 0) {
        setAviso('No pudimos conectar con el servidor. Inténtalo más tarde.')
        return
      }
      if (error.status >= 500) {
        setAviso('Ocurrió un error inesperado. Inténtalo más tarde.')
        return
      }
      setAviso(error.message)
    }
  })

  return (
    <ContenedorEstrecho>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Link
          to={RUTAS.adminEventos}
          className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
        >
          ← Eventos
        </Link>
        <h1 className="mt-2 font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100">
          Nuevo evento
        </h1>
        {aviso ? (
          <div className="mt-4">
            <Aviso tipo="error" mensaje={aviso} />
          </div>
        ) : null}
        {consultaSedes.error ? (
          <div className="mt-4">
            <Aviso tipo="error" mensaje="No pudimos cargar las sedes activas." />
          </div>
        ) : null}
        <FormularioEvento
          form={form}
          onEnviar={enviar}
          descripcion={descripcion}
          opcionesSedes={opcionesSedes}
          cargandoSedes={consultaSedes.isPending}
          minFecha={minActual()}
          cargandoEnvio={mutacion.isPending}
        />
      </div>
    </ContenedorEstrecho>
  )
}

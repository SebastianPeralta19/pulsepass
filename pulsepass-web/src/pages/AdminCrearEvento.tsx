import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import Aviso from '../componentes/Aviso'
import Boton from '../componentes/Boton'
import Campo from '../componentes/Campo'
import Selector from '../componentes/Selector'
import { useCreados } from '../funcionalidades/eventos/CreadosContext'
import { useCrearEvento } from '../funcionalidades/eventos/hooks'
import { CrearEventoSchema, EventCategorySchema } from '../funcionalidades/eventos/tipos'
import type { EventCategory } from '../funcionalidades/eventos/tipos'
import { useSedesActivas } from '../funcionalidades/sedes/hooks'
import { ContenedorEstrecho } from '../layouts/Layout'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'

const ETIQUETAS_CATEGORIA: Record<EventCategory, string> = {
  MUSIC: 'Música',
  SPORTS: 'Deportes',
  TECHNOLOGY: 'Tecnología',
  EDUCATION: 'Educación',
  CULTURE: 'Cultura',
  ENTERTAINMENT: 'Entretenimiento',
}

const FormularioEventoSchema = CrearEventoSchema.extend({
  minimumAge: z.number().int('Debe ser un entero').min(0, 'Debe ser mayor o igual que 0'),
})
type FormularioEvento = z.infer<typeof FormularioEventoSchema>

const CAMPOS: readonly (keyof FormularioEvento)[] = [
  'eventCode',
  'name',
  'description',
  'category',
  'eventDate',
  'minimumAge',
  'venueCode',
]

const OPCIONES_CATEGORIA = EventCategorySchema.options.map((valor) => ({
  valor,
  etiqueta: ETIQUETAS_CATEGORIA[valor],
}))

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
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    control,
    formState: { errors },
  } = useForm<FormularioEvento>({
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
  const descripcion = useWatch({ control, name: 'description' }) ?? ''
  const sedes = consultaSedes.data ?? []
  const opcionesSedes = sedes.map((sede) => ({
    valor: sede.code,
    etiqueta: `${sede.name} (${sede.code})`,
  }))
  const minFecha = minActual()

  const enviar = handleSubmit(async (datos) => {
    setAviso('')
    clearErrors()
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

        <form onSubmit={enviar} className="mt-6 space-y-4" noValidate>
          <Campo
            etiqueta="Código del evento"
            autoCapitalize="characters"
            placeholder="CMF-2026"
            {...register('eventCode')}
            error={errors.eventCode?.message}
          />
          <Campo
            etiqueta="Nombre"
            placeholder="Caribbean Music Fest 2026"
            {...register('name')}
            error={errors.name?.message}
          />

          <div className="w-full">
            <label
              htmlFor="descripcion"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Descripción
            </label>
            <textarea
              id="descripcion"
              rows={4}
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={
                errors.description ? 'descripcion-error descripcion-contador' : 'descripcion-contador'
              }
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              {...register('description')}
            />
            <p id="descripcion-contador" className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">
              {descripcion.length}/500
            </p>
            {errors.description?.message ? (
              <p id="descripcion-error" className="mt-1 text-sm text-red-700 dark:text-red-400">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Selector
              etiqueta="Categoría"
              opciones={OPCIONES_CATEGORIA}
              {...register('category')}
              error={errors.category?.message}
            />
            <Campo
              etiqueta="Edad mínima"
              type="number"
              min={0}
              step={1}
              {...register('minimumAge', { valueAsNumber: true })}
              error={errors.minimumAge?.message}
            />
          </div>

          <Campo
            etiqueta="Fecha y hora"
            type="datetime-local"
            min={minFecha}
            {...register('eventDate')}
            error={errors.eventDate?.message}
          />

          <Selector
            etiqueta="Sede"
            opciones={opcionesSedes}
            opcionVacia={consultaSedes.isPending ? 'Cargando sedes…' : 'Selecciona una sede'}
            disabled={opcionesSedes.length === 0}
            {...register('venueCode')}
            error={errors.venueCode?.message}
          />

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Link
              to={RUTAS.adminEventos}
              className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-slate-600 hover:underline focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-slate-300"
            >
              Cancelar
            </Link>
            <Boton type="submit" cargando={mutacion.isPending}>
              Crear evento
            </Boton>
          </div>
        </form>
      </div>
    </ContenedorEstrecho>
  )
}

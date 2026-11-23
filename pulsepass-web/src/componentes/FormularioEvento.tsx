import type { FormEventHandler } from 'react'
import { Link } from 'react-router'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import Boton from './Boton'
import Campo from './Campo'
import CampoDescripcion from './CampoDescripcion'
import { ETIQUETAS_CATEGORIA } from './EtiquetaCategoria'
import Selector from './Selector'
import { CrearEventoSchema, EventCategorySchema } from '../funcionalidades/eventos/tipos'
import { RUTAS } from '../lib/rutas'

export const FormularioEventoSchema = CrearEventoSchema.extend({
  minimumAge: z.number().int('Debe ser un entero').min(0, 'Debe ser mayor o igual que 0'),
})
export type DatosFormularioEvento = z.infer<typeof FormularioEventoSchema>

export const CAMPOS_FORMULARIO_EVENTO: readonly (keyof DatosFormularioEvento)[] = [
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

export default function FormularioEvento({
  form,
  onEnviar,
  descripcion,
  opcionesSedes,
  cargandoSedes,
  minFecha,
  cargandoEnvio,
}: {
  form: UseFormReturn<DatosFormularioEvento>
  onEnviar: FormEventHandler<HTMLFormElement>
  descripcion: string
  opcionesSedes: { valor: string; etiqueta: string }[]
  cargandoSedes: boolean
  minFecha: string
  cargandoEnvio: boolean
}) {
  const { register, formState } = form
  const { errors } = formState

  return (
    <form onSubmit={onEnviar} className="mt-6 space-y-4" noValidate>
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
      <CampoDescripcion descripcion={descripcion} error={errors.description?.message}>
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
      </CampoDescripcion>
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
        opcionVacia={cargandoSedes ? 'Cargando sedes…' : 'Selecciona una sede'}
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
        <Boton type="submit" cargando={cargandoEnvio}>
          Crear evento
        </Boton>
      </div>
    </form>
  )
}

import type { ComponentProps } from 'react'
import { useId } from 'react'
import clsx from 'clsx'

interface SelectorProps extends ComponentProps<'select'> {
  etiqueta: string
  error?: string
  opciones: { valor: string; etiqueta: string }[]
  opcionVacia?: string
}

export default function Selector({
  etiqueta,
  error,
  opciones,
  opcionVacia,
  id,
  className,
  ...props
}: SelectorProps) {
  const generado = useId()
  const idCampo = id ?? generado
  const idAyuda = error ? `${idCampo}-error` : undefined

  return (
    <div className="w-full">
      <label
        htmlFor={idCampo}
        className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {etiqueta}
      </label>
      <select
        {...props}
        id={idCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={idAyuda}
        className={clsx(
          'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
          error && 'border-red-500',
          className,
        )}
      >
        {opcionVacia ? <option value="">{opcionVacia}</option> : null}
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
      {error ? (
        <p id={idAyuda} className="mt-1 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}

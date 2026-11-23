import type { ComponentProps } from 'react'
import { useId } from 'react'
import clsx from 'clsx'

interface CampoProps extends ComponentProps<'input'> {
  etiqueta: string
  error?: string
  pista?: string
}

export default function Campo({
  etiqueta,
  error,
  pista,
  id,
  className,
  ...props
}: CampoProps) {
  const generado = useId()
  const idCampo = id ?? generado
  const idAyuda = error ? `${idCampo}-error` : pista ? `${idCampo}-pista` : undefined

  return (
    <div className="w-full">
      <label
        htmlFor={idCampo}
        className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {etiqueta}
      </label>
      <input
        {...props}
        id={idCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={idAyuda}
        className={clsx(
          'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
          error && 'border-red-500 dark:border-red-500',
          className,
        )}
      />
      {error ? (
        <p id={idAyuda} className="mt-1 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : pista ? (
        <p id={idAyuda} className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {pista}
        </p>
      ) : null}
    </div>
  )
}

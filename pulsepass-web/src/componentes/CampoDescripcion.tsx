import type { ReactNode } from 'react'

export default function CampoDescripcion({
  descripcion,
  error,
  children,
}: {
  descripcion: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="w-full">
      <label
        htmlFor="descripcion"
        className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        Descripción
      </label>
      {children}
      <p id="descripcion-contador" className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">
        {descripcion.length}/500
      </p>
      {error ? (
        <p id="descripcion-error" className="mt-1 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}

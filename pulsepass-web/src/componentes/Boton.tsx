import type { ComponentProps, ReactNode } from 'react'
import clsx from 'clsx'

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma'

const CLASES_VARIANTE: Record<Variante, string> = {
  primario:
    'bg-marca-600 text-white hover:bg-marca-700 disabled:bg-marca-500 dark:hover:bg-marca-700',
  secundario:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
  peligro: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-500',
  fantasma:
    'bg-transparent text-marca-700 hover:bg-marca-50 dark:text-marca-500 dark:hover:bg-slate-800',
}

interface BotonProps extends ComponentProps<'button'> {
  variante?: Variante
  cargando?: boolean
  children: ReactNode
}

export default function Boton({
  variante = 'primario',
  cargando = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: BotonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 disabled:cursor-not-allowed disabled:opacity-60',
        CLASES_VARIANTE[variante],
        className,
      )}
    >
      {cargando ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          Cargando…
        </>
      ) : (
        children
      )}
    </button>
  )
}

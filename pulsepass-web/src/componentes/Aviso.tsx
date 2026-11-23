import clsx from 'clsx'
import { IconoCheck, IconoCorreo, IconoAdvertencia } from './Iconos'

type TipoAviso = 'exito' | 'error' | 'info'

const CLASES: Record<TipoAviso, string> = {
  exito: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  error: 'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  info: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
}

interface AvisoProps {
  tipo: TipoAviso
  mensaje: string
  onCerrar?: () => void
  className?: string
}

export default function Aviso({ tipo, mensaje, onCerrar, className }: AvisoProps) {
  const Icono = tipo === 'exito' ? IconoCheck : tipo === 'error' ? IconoAdvertencia : IconoCorreo
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      aria-live={tipo === 'error' ? 'assertive' : 'polite'}
      className={clsx(
        'flex items-start gap-2 rounded-lg border px-4 py-3 text-sm',
        CLASES[tipo],
        className,
      )}
    >
      <Icono className="mt-0.5 h-5 w-5 shrink-0" />
      <span className="flex-1">{mensaje}</span>
      {onCerrar ? (
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar aviso"
          className="rounded focus-visible:outline-2 focus-visible:outline-marca-600"
        >
          ×
        </button>
      ) : null}
    </div>
  )
}

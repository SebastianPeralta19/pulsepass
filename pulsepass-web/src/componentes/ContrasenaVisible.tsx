import type { ReactNode } from 'react'
import { IconoOjo, IconoOjoCerrado } from './Iconos'

export default function ContrasenaVisible({
  visible,
  alAlternar,
  children,
}: {
  visible: boolean
  alAlternar: () => void
  children: ReactNode
}) {
  return (
    <div className="relative">
      {children}
      <button
        type="button"
        onClick={alAlternar}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        className="absolute right-2 top-9 rounded-md p-2 text-slate-600 focus-visible:outline-2 focus-visible:outline-marca-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {visible ? (
          <IconoOjoCerrado className="h-5 w-5" />
        ) : (
          <IconoOjo className="h-5 w-5" />
        )}
      </button>
    </div>
  )
}

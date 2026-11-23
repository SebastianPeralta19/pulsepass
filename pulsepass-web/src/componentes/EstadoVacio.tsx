import type { ReactNode } from 'react'
import { IconoBuscar } from './Iconos'

export default function EstadoVacio({
  mensaje,
  accion,
}: {
  mensaje: string
  accion?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
      <IconoBuscar className="h-10 w-10 text-slate-400" />
      <p className="text-slate-600 dark:text-slate-400">{mensaje}</p>
      {accion}
    </div>
  )
}

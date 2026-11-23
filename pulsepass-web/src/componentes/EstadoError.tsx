import { IconoAdvertencia } from './Iconos'
import Boton from './Boton'

export default function EstadoError({
  mensaje,
  onReintentar,
}: {
  mensaje: string
  onReintentar?: () => void
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-900 dark:bg-red-950">
      <IconoAdvertencia className="h-10 w-10 text-red-600 dark:text-red-400" />
      <p className="text-red-800 dark:text-red-200">{mensaje}</p>
      {onReintentar ? (
        <Boton variante="secundario" onClick={onReintentar}>
          Reintentar
        </Boton>
      ) : null}
    </div>
  )
}

import Boton from './Boton'
import Tarjeta from './Tarjeta'

export default function PublicacionAdminEvento({
  borrador,
  onPublicar,
}: {
  borrador: boolean
  onPublicar: () => void
}) {
  return (
    <Tarjeta className="mt-6 p-5">
      <h2 className="font-titulo text-xl font-bold text-slate-900 dark:text-slate-100">
        Publicación
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        El evento es visible al público una vez publicado.
      </p>
      {borrador ? (
        <div className="mt-4 flex justify-end">
          <Boton onClick={onPublicar}>Publicar</Boton>
        </div>
      ) : (
        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
          El evento ya no está en borrador.
        </p>
      )}
    </Tarjeta>
  )
}

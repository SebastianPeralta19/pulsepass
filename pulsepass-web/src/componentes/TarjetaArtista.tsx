import { CodigoTexto } from './CodigoTexto'
import Tarjeta from './Tarjeta'
import type { ArtistResponse } from '../funcionalidades/artistas/tipos'

export default function TarjetaArtista({ artista }: { artista: ArtistResponse }) {
  return (
    <Tarjeta className="mt-4 flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
      <span
        aria-hidden="true"
        className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-marca-50 font-titulo text-4xl font-bold text-marca-700 dark:bg-slate-800 dark:text-marca-500"
      >
        {artista.stageName.charAt(0).toUpperCase() || 'A'}
      </span>
      <div>
        <h1 className="font-titulo text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
          {artista.stageName}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Código: <CodigoTexto>{String(artista.id)}</CodigoTexto>
        </p>
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="font-semibold text-slate-800 dark:text-slate-200">Género</dt>
            <dd className="text-slate-600 dark:text-slate-400">
              {artista.genre ?? 'No definido'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800 dark:text-slate-200">País</dt>
            <dd className="text-slate-600 dark:text-slate-400">
              {artista.country ?? 'No definido'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800 dark:text-slate-200">Estado</dt>
            <dd className="text-slate-600 dark:text-slate-400">
              {artista.active ? 'Activo' : 'Inactivo'}
            </dd>
          </div>
        </dl>
      </div>
    </Tarjeta>
  )
}

import { Link } from 'react-router'
import { IconoUsuario } from './Iconos'
import Tarjeta from './Tarjeta'
import type { ArtistResponse } from '../funcionalidades/artistas/tipos'
import { RUTAS } from '../lib/rutas'

export default function ListaArtistasEvento({ artistas }: { artistas: ArtistResponse[] }) {
  return (
    <Tarjeta className="p-6">
      <h2 className="font-titulo text-xl font-bold">Artistas</h2>
      {artistas.length === 0 ? (
        <p className="mt-2 text-slate-600 dark:text-slate-400">Sin artistas registrados.</p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-3">
          {artistas.map((artista) => (
            <li key={artista.id}>
              <Link
                to={RUTAS.artista(artista.id)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-marca-500 hover:text-marca-700 focus-visible:outline-2 focus-visible:outline-marca-600 dark:border-slate-700 dark:text-slate-200 dark:hover:text-marca-500"
              >
                <IconoUsuario className="h-4 w-4 shrink-0" />
                {artista.stageName}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  )
}

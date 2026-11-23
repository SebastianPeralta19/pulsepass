import Boton from './Boton'
import { IconoUsuario } from './Iconos'
import Selector from './Selector'
import Tarjeta from './Tarjeta'
import type { ArtistResponse } from '../funcionalidades/artistas/tipos'

export default function ArtistasAdminEvento({
  artistas,
  opciones,
  seleccion,
  cargandoArtistas,
  errorArtistas,
  asociando,
  puedeAsociar,
  onSeleccionar,
  onAsociar,
}: {
  artistas: ArtistResponse[]
  opciones: { valor: string; etiqueta: string }[]
  seleccion: string
  cargandoArtistas: boolean
  errorArtistas: unknown
  asociando: boolean
  puedeAsociar: boolean
  onSeleccionar: (valor: string) => void
  onAsociar: () => void
}) {
  return (
    <Tarjeta className="mt-6 p-5">
      <h2 className="font-titulo text-xl font-bold text-slate-900 dark:text-slate-100">
        Artistas asociados
      </h2>
      {artistas.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Sin artistas registrados.
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {artistas.map((artista) => (
            <li
              key={artista.id}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              <IconoUsuario className="h-4 w-4 shrink-0" />
              {artista.stageName}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Selector
          etiqueta="Agregar artista"
          opciones={opciones}
          opcionVacia={
            cargandoArtistas
              ? 'Cargando artistas…'
              : opciones.length === 0
                ? 'No hay artistas disponibles'
                : 'Selecciona un artista'
          }
          value={seleccion}
          onChange={(eventoSelect) => onSeleccionar(eventoSelect.target.value)}
          disabled={opciones.length === 0}
        />
        <Boton cargando={asociando} disabled={!puedeAsociar} onClick={onAsociar}>
          Asociar artista
        </Boton>
      </div>
      {errorArtistas ? (
        <p className="mt-2 text-sm text-red-700 dark:text-red-400" role="alert">
          No pudimos cargar los artistas activos.
        </p>
      ) : null}
    </Tarjeta>
  )
}

import Selector from './Selector'
import Boton from './Boton'
import { ETIQUETAS_CATEGORIA } from './EtiquetaCategoria'
import { EventCategorySchema } from '../funcionalidades/eventos/tipos'
import type { EventCategory } from '../funcionalidades/eventos/tipos'

const OPCIONES_CATEGORIA = EventCategorySchema.options.map((categoria) => ({
  valor: categoria,
  etiqueta: ETIQUETAS_CATEGORIA[categoria],
}))

export default function FiltrosCatalogo({
  valores,
  onActualizar,
  onLimpiar,
}: {
  valores: { q?: string; categoria?: EventCategory; artista?: string }
  onActualizar: (clave: 'q' | 'categoria' | 'artista', valor: string) => void
  onLimpiar: () => void
}) {
  return (
    <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,14rem)_auto] lg:items-end">
      <div className="w-full">
        <label
          htmlFor="filtro-q"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Buscar por nombre o ciudad
        </label>
        <input
          id="filtro-q"
          type="search"
          value={valores.q ?? ''}
          onChange={(evento) => onActualizar('q', evento.target.value)}
          placeholder="Buscar por nombre…"
          className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>
      <Selector
        etiqueta="Categoría"
        opciones={OPCIONES_CATEGORIA}
        opcionVacia="Todas las categorías"
        value={valores.categoria ?? ''}
        onChange={(evento) => onActualizar('categoria', evento.target.value)}
      />
      <div className="w-full">
        <label
          htmlFor="filtro-artista"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Artista
        </label>
        <input
          id="filtro-artista"
          type="search"
          value={valores.artista ?? ''}
          onChange={(evento) => onActualizar('artista', evento.target.value)}
          placeholder="Nombre artístico"
          className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>
      <Boton variante="fantasma" onClick={onLimpiar} disabled={!hayFiltros(valores)}>
        Limpiar
      </Boton>
    </div>
  )
}

function hayFiltros(valores: { q?: string; categoria?: string; artista?: string }): boolean {
  return Boolean(valores.q || valores.categoria || valores.artista)
}

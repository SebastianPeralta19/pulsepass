import { Link, useSearchParams } from 'react-router'
import { z } from 'zod'
import Badge from '../componentes/Badge'
import Boton from '../componentes/Boton'
import Cargando from '../componentes/Cargando'
import EstadoError from '../componentes/EstadoError'
import EstadoVacio from '../componentes/EstadoVacio'
import Selector from '../componentes/Selector'
import Tarjeta from '../componentes/Tarjeta'
import { IconoCalendario, IconoUbicacion } from '../componentes/Iconos'
import { useEventosPorArtista, useEventosPublicados } from '../funcionalidades/eventos/hooks'
import { EventCategorySchema } from '../funcionalidades/eventos/tipos'
import type { EventCategory } from '../funcionalidades/eventos/tipos'
import { useSedesActivas } from '../funcionalidades/sedes/hooks'
import { Contenedor } from '../layouts/Layout'
import { formatearFecha } from '../lib/formato'
import { RUTAS } from '../lib/rutas'

const EsquemaFiltros = z.object({
  categoria: EventCategorySchema.optional(),
  q: z.string().optional(),
  artista: z.string().optional(),
})

const ETIQUETAS_CATEGORIA: Record<EventCategory, string> = {
  MUSIC: 'Música',
  SPORTS: 'Deportes',
  TECHNOLOGY: 'Tecnología',
  EDUCATION: 'Educación',
  CULTURE: 'Cultura',
  ENTERTAINMENT: 'Entretenimiento',
}

const OPCIONES_CATEGORIA = EventCategorySchema.options.map((categoria) => ({
  valor: categoria,
  etiqueta: ETIQUETAS_CATEGORIA[categoria],
}))

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos cargar la cartelera.'
}

export default function CatalogoEventos() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filtros = EsquemaFiltros.safeParse({
    categoria: searchParams.get('categoria') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    artista: searchParams.get('artista') ?? undefined,
  })
  const valores = filtros.success ? filtros.data : {}
  const texto = valores.q?.trim().toLocaleLowerCase('es') ?? ''
  const nombreArtista = valores.artista?.trim() ?? ''
  const buscandoArtista = Boolean(nombreArtista)
  const consultaPublicados = useEventosPublicados()
  const consultaArtista = useEventosPorArtista(nombreArtista)
  const consultaSedes = useSedesActivas()
  const consulta = buscandoArtista ? consultaArtista : consultaPublicados
  const eventos = consulta.data ?? []
  const ciudades = new Map<string, string>(
    (consultaSedes.data ?? []).map((sede): [string, string] => [sede.code, sede.city]),
  )
  const filtrados = eventos.filter((evento) => {
    const coincideCategoria = !valores.categoria || evento.category === valores.categoria
    const coincideTexto =
      !texto ||
      evento.name.toLocaleLowerCase('es').includes(texto) ||
      (evento.venueName ?? '').toLocaleLowerCase('es').includes(texto) ||
      (evento.venueCode ? (ciudades.get(evento.venueCode) ?? '') : '')
        .toLocaleLowerCase('es')
        .includes(texto)
    return coincideCategoria && coincideTexto
  })
  const hayFiltros = Boolean(valores.q || valores.categoria || valores.artista)

  function actualizarParametro(clave: 'q' | 'categoria' | 'artista', valor: string) {
    const parametros = new URLSearchParams(searchParams)
    if (valor) parametros.set(clave, valor)
    else parametros.delete(clave)
    setSearchParams(parametros)
  }

  function limpiarFiltros() {
    setSearchParams(new URLSearchParams())
  }

  return (
    <Contenedor>
      <h1 className="font-titulo text-3xl font-bold sm:text-4xl">Cartelera</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Encuentra el evento perfecto para tu próxima salida.
      </p>

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
            onChange={(evento) => actualizarParametro('q', evento.target.value)}
            placeholder="Buscar por nombre…"
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
        <Selector
          etiqueta="Categoría"
          opciones={OPCIONES_CATEGORIA}
          opcionVacia="Todas las categorías"
          value={valores.categoria ?? ''}
          onChange={(evento) => actualizarParametro('categoria', evento.target.value)}
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
            onChange={(evento) => actualizarParametro('artista', evento.target.value)}
            placeholder="Nombre artístico"
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
        <Boton variante="fantasma" onClick={limpiarFiltros} disabled={!hayFiltros}>
          Limpiar
        </Boton>
      </div>

      <p aria-live="polite" className="mt-6 text-sm font-medium text-slate-600 dark:text-slate-400">
        {filtrados.length} eventos
      </p>

      <div className="mt-4">
        {consulta.isPending ? (
          <Cargando etiqueta="Cargando eventos" lineas={6} />
        ) : consulta.error ? (
          <EstadoError
            mensaje={mensajeError(consulta.error)}
            onReintentar={() => void consulta.refetch()}
          />
        ) : filtrados.length === 0 ? (
          <EstadoVacio
            mensaje={
              hayFiltros
                ? 'Sin resultados para tu búsqueda'
                : 'Aún no hay eventos publicados'
            }
            accion={
              hayFiltros ? (
                <Boton variante="secundario" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Boton>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((evento) => (
              <Tarjeta
                key={evento.eventCode}
                className="h-full transition-shadow hover:shadow-md"
              >
                <Link
                  to={RUTAS.evento(evento.eventCode)}
                  className="flex h-full flex-col gap-3 rounded-xl p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-marca-50 px-2.5 py-1 text-xs font-semibold text-marca-700 dark:bg-slate-800 dark:text-marca-500">
                      {ETIQUETAS_CATEGORIA[evento.category]}
                    </span>
                    <Badge estado={evento.status} />
                  </div>
                  <h2 className="font-titulo text-xl font-bold text-slate-900 dark:text-slate-100">
                    {evento.name}
                  </h2>
                  <dl className="mt-auto space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <IconoCalendario className="h-4 w-4 shrink-0" />
                      <dt className="sr-only">Fecha</dt>
                      <dd>{formatearFecha(evento.eventDate)}</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconoUbicacion className="h-4 w-4 shrink-0" />
                      <dt className="sr-only">Sede</dt>
                      <dd>{evento.venueName ?? 'Sede por definir'}</dd>
                    </div>
                  </dl>
                </Link>
              </Tarjeta>
            ))}
          </div>
        )}
      </div>
    </Contenedor>
  )
}

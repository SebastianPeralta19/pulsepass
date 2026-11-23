import { useSearchParams } from 'react-router'
import { z } from 'zod'
import Boton from '../componentes/Boton'
import Cargando from '../componentes/Cargando'
import EstadoError from '../componentes/EstadoError'
import EstadoVacio from '../componentes/EstadoVacio'
import FiltrosCatalogo from '../componentes/FiltrosCatalogo'
import TarjetaEventoCatalogo from '../componentes/TarjetaEventoCatalogo'
import { useEventosPorArtista, useEventosPublicados } from '../funcionalidades/eventos/hooks'
import { EventCategorySchema } from '../funcionalidades/eventos/tipos'
import { useSedesActivas } from '../funcionalidades/sedes/hooks'
import { Contenedor } from '../layouts/Layout'

const EsquemaFiltros = z.object({
  categoria: EventCategorySchema.optional(),
  q: z.string().optional(),
  artista: z.string().optional(),
})

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
      <FiltrosCatalogo
        valores={valores}
        onActualizar={actualizarParametro}
        onLimpiar={limpiarFiltros}
      />
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
              hayFiltros ? 'Sin resultados para tu búsqueda' : 'Aún no hay eventos publicados'
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
              <TarjetaEventoCatalogo key={evento.eventCode} evento={evento} />
            ))}
          </div>
        )}
      </div>
    </Contenedor>
  )
}

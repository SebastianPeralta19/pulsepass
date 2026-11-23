import { Link, useSearchParams } from 'react-router'
import { z } from 'zod'
import Boton from '../componentes/Boton'
import Cargando from '../componentes/Cargando'
import EstadoError from '../componentes/EstadoError'
import EstadoVacio from '../componentes/EstadoVacio'
import Tarjeta from '../componentes/Tarjeta'
import { IconoBuscar } from '../componentes/Iconos'
import { useArtistaPorNombre, useArtistasActivos } from '../funcionalidades/artistas/hooks'
import type { ArtistResponse } from '../funcionalidades/artistas/tipos'
import { ApiError } from '../lib/http'
import { Contenedor } from '../layouts/Layout'
import { RUTAS } from '../lib/rutas'

const EsquemaBusqueda = z.object({ q: z.string().optional() })

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos cargar los artistas.'
}

function TarjetaArtista({ artista }: { artista: ArtistResponse }) {
  const inicial = artista.stageName.charAt(0).toUpperCase() || 'A'
  return (
    <Tarjeta className="h-full transition-shadow hover:shadow-md">
      <Link
        to={RUTAS.artista(artista.id)}
        className="flex h-full flex-col items-center gap-3 rounded-xl p-6 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
      >
        <span
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-marca-50 font-titulo text-2xl font-bold text-marca-700 dark:bg-slate-800 dark:text-marca-500"
        >
          {inicial}
        </span>
        <span className="font-titulo text-lg font-bold text-slate-900 dark:text-slate-100">
          {artista.stageName}
        </span>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {artista.genre ?? 'Género no definido'}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-500">
          {artista.country ?? 'País no definido'}
        </span>
      </Link>
    </Tarjeta>
  )
}

export default function ListaArtistas() {
  const [searchParams, setSearchParams] = useSearchParams()
  const busqueda = EsquemaBusqueda.safeParse({ q: searchParams.get('q') ?? undefined })
  const consulta = busqueda.success ? busqueda.data.q?.trim() ?? '' : ''
  const consultaActivos = useArtistasActivos()
  const consultaNombre = useArtistaPorNombre(consulta, Boolean(consulta))
  const activos = consultaActivos.data ?? []
  const artistas = consulta ? (consultaNombre.data ? [consultaNombre.data] : []) : activos
  const consultaActual = consulta ? consultaNombre : consultaActivos

  function limpiarBusqueda() {
    setSearchParams(new URLSearchParams())
  }

  function alBuscar(valor: string) {
    const parametros = new URLSearchParams(searchParams)
    if (valor) parametros.set('q', valor)
    else parametros.delete('q')
    setSearchParams(parametros)
  }

  const error = consultaActual.error
  const noEncontrado =
    error instanceof ApiError && (error.status === 403 || error.status === 404)

  return (
    <Contenedor>
      <h1 className="font-titulo text-3xl font-bold sm:text-4xl">Artistas</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Conoce a los artistas que hacen vibrar cada escenario.
      </p>

      <div className="mt-6 max-w-md">
        <label
          htmlFor="buscar-artista"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Buscar por nombre artístico
        </label>
        <div className="relative">
          <IconoBuscar className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="buscar-artista"
            type="search"
            value={consulta}
            onChange={(evento) => alBuscar(evento.target.value)}
            placeholder="Buscar artista…"
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="mt-8">
        {consultaActual.isPending ? (
          <Cargando etiqueta="Cargando artistas" lineas={4} />
        ) : noEncontrado ? (
          <EstadoVacio
            mensaje="No encontramos artistas con ese nombre"
            accion={
              <Boton variante="secundario" onClick={limpiarBusqueda}>
                Limpiar búsqueda
              </Boton>
            }
          />
        ) : error ? (
          <EstadoError
            mensaje={mensajeError(error)}
            onReintentar={() => void consultaActual.refetch()}
          />
        ) : artistas.length === 0 ? (
          <EstadoVacio
            mensaje={
              consulta ? 'No encontramos artistas con ese nombre' : 'Aún no hay artistas activos'
            }
            accion={
              consulta ? (
                <Boton variante="secundario" onClick={limpiarBusqueda}>
                  Limpiar búsqueda
                </Boton>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artistas.map((artista) => (
              <TarjetaArtista key={artista.id} artista={artista} />
            ))}
          </div>
        )}
      </div>
    </Contenedor>
  )
}

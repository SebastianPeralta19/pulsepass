import { useQuery } from '@tanstack/react-query'
import * as api from './api'
import { CLAVES, TIEMPOS } from '../../lib/consultas'

export function useArtistasActivos() {
  return useQuery({
    queryKey: CLAVES.artistasActivos,
    queryFn: api.listarActivos,
    staleTime: TIEMPOS.artistasActivos,
  })
}

export function useArtista(id: number) {
  return useQuery({
    queryKey: CLAVES.artista(id),
    queryFn: () => api.obtenerPorId(id),
    enabled: Number.isInteger(id) && id > 0,
    staleTime: TIEMPOS.artista,
  })
}

export function useArtistaPorNombre(stageName: string, enabled = true) {
  return useQuery({
    queryKey: [...CLAVES.artistasActivos, 'por-nombre', stageName] as const,
    queryFn: () => api.obtenerPorNombre(stageName),
    enabled: enabled && Boolean(stageName.trim()),
    staleTime: TIEMPOS.artista,
  })
}

import { useQuery } from '@tanstack/react-query'
import * as api from './api'
import { CLAVES, TIEMPOS } from '../../lib/consultas'

export function useSedesActivas() {
  return useQuery({
    queryKey: CLAVES.sedesActivas,
    queryFn: api.listarActivas,
    staleTime: TIEMPOS.sedesActivas,
  })
}

export function useSede(code: string) {
  return useQuery({
    queryKey: CLAVES.sede(code),
    queryFn: () => api.obtenerPorCodigo(code),
    enabled: Boolean(code.trim()),
    staleTime: TIEMPOS.sede,
  })
}

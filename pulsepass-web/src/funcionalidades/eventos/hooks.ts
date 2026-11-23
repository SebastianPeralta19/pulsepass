import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { CrearEventoForm } from './tipos'
import { CLAVES, TIEMPOS } from '../../lib/consultas'

interface OpcionesEvento {
  enabled?: boolean
  throwOnError?: boolean
}

export function useEventosPublicados() {
  return useQuery({
    queryKey: CLAVES.eventosPublicados,
    queryFn: api.listarPublicados,
    staleTime: TIEMPOS.eventosPublicados,
  })
}

export function useEvento(eventCode: string, opciones: OpcionesEvento = {}) {
  return useQuery({
    queryKey: CLAVES.evento(eventCode),
    queryFn: () => api.obtenerPorCodigo(eventCode),
    enabled: (opciones.enabled ?? true) && Boolean(eventCode),
    throwOnError: opciones.throwOnError ?? false,
    staleTime: TIEMPOS.evento,
  })
}

export function useEventosPorArtista(stageName: string) {
  return useQuery({
    queryKey: CLAVES.eventosPorArtista(stageName),
    queryFn: () => api.listarPorArtista(stageName),
    enabled: Boolean(stageName.trim()),
    staleTime: TIEMPOS.eventosPorArtista,
  })
}

export function useCrearEvento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: CrearEventoForm) => api.crear(datos),
    onSuccess: (respuesta) => {
      const clave = CLAVES.evento(respuesta.eventCode)
      queryClient.setQueryData(clave, respuesta)
      void queryClient.invalidateQueries({ queryKey: clave })
    },
  })
}

export function usePublicarEvento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (eventCode: string) => api.publicar(eventCode),
    onSuccess: (_respuesta, eventCode) => {
      void queryClient.invalidateQueries({ queryKey: CLAVES.evento(eventCode) })
      void queryClient.invalidateQueries({ queryKey: CLAVES.eventosPublicados })
    },
  })
}

export function useAsociarArtista() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variables: {
      eventCode: string
      artistId: number
      stageName: string
    }) => api.asociarArtista(variables.eventCode, variables.artistId),
    onSuccess: (_respuesta, variables) => {
      void queryClient.invalidateQueries({ queryKey: CLAVES.evento(variables.eventCode) })
      void queryClient.invalidateQueries({
        queryKey: CLAVES.eventosPorArtista(variables.stageName),
      })
    },
  })
}

import { useMutation, useQuery } from '@tanstack/react-query'
import { CLAVES, TIEMPOS } from '../../lib/consultas'
import * as api from './api'
import type { RegistroUsuarioForm } from './tipos'

export function useRegistrarUsuario() {
  return useMutation({
    mutationFn: (datos: RegistroUsuarioForm) => api.registrar(datos),
  })
}

export function useUsuarioPorEmail(email: string) {
  return useQuery({
    queryKey: CLAVES.usuario(email),
    queryFn: () => api.obtenerPorEmail(email),
    enabled: Boolean(email.trim()),
    staleTime: TIEMPOS.usuario,
  })
}

export function useUsuarioPorUsername(username: string) {
  return useQuery({
    queryKey: CLAVES.usuario(username),
    queryFn: () => api.obtenerPorUsername(username),
    enabled: Boolean(username.trim()),
    staleTime: TIEMPOS.usuario,
  })
}

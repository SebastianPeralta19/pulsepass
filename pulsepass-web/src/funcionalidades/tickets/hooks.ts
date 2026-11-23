import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CLAVES, TIEMPOS } from '../../lib/consultas'
import * as api from './api'
import type { TicketType } from './tipos'

interface OpcionesTicket {
  enabled?: boolean
  throwOnError?: boolean
}

interface VariablesComprarTicket {
  userEmail: string
  eventCode: string
  type: TicketType
}

interface VariablesCancelarTicket {
  ticketCode: string
  eventCode: string
  email: string
}

interface VariablesUsarTicket {
  ticketCode: string
  eventCode: string
}

export function useComprarTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variables: VariablesComprarTicket) =>
      api.comprar(variables.userEmail, variables.eventCode, variables.type),
    onSuccess: (_ticket, variables) => {
      void queryClient.invalidateQueries({ queryKey: CLAVES.ticketsUsuario(variables.userEmail) })
      void queryClient.invalidateQueries({ queryKey: CLAVES.evento(variables.eventCode) })
    },
  })
}

export function useMisTickets(email: string) {
  return useQuery({
    queryKey: CLAVES.ticketsUsuario(email),
    queryFn: () => api.listarPorUsuario(email),
    enabled: email.trim().length > 0,
    staleTime: TIEMPOS.ticketsUsuario,
  })
}

export function useTicket(ticketCode: string, opciones: OpcionesTicket = {}) {
  return useQuery({
    queryKey: CLAVES.ticket(ticketCode),
    queryFn: () => api.obtenerPorCodigo(ticketCode),
    enabled: (opciones.enabled ?? true) && ticketCode.trim().length > 0,
    throwOnError: opciones.throwOnError ?? false,
    staleTime: TIEMPOS.ticket,
  })
}

export function useTicketsPagados(eventCode: string) {
  return useQuery({
    queryKey: CLAVES.ticketsPagados(eventCode),
    queryFn: () => api.listarPagados(eventCode),
    enabled: eventCode.trim().length > 0,
    staleTime: TIEMPOS.ticketsPagados,
  })
}

export function useCancelarTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variables: VariablesCancelarTicket) => api.cancelar(variables.ticketCode),
    onSuccess: (_ticket, variables) => {
      void queryClient.invalidateQueries({ queryKey: CLAVES.ticketsUsuario(variables.email) })
      void queryClient.invalidateQueries({ queryKey: CLAVES.ticket(variables.ticketCode) })
      void queryClient.invalidateQueries({ queryKey: CLAVES.ticketsPagados(variables.eventCode) })
    },
  })
}

export function useUsarTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variables: VariablesUsarTicket) => api.usar(variables.ticketCode),
    onSuccess: (_ticket, variables) => {
      void queryClient.invalidateQueries({ queryKey: CLAVES.ticket(variables.ticketCode) })
      void queryClient.invalidateQueries({ queryKey: CLAVES.ticketsPagados(variables.eventCode) })
    },
  })
}

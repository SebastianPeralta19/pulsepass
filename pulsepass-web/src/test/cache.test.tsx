import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { useAsociarArtista, useCrearEvento, usePublicarEvento } from '../funcionalidades/eventos/hooks'
import {
  useCancelarTicket,
  useComprarTicket,
  useUsarTicket,
} from '../funcionalidades/tickets/hooks'
import { CLAVES } from '../lib/consultas'

function crearWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

function preparar() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
  return { queryClient, invalidar, wrapper: crearWrapper(queryClient) }
}

describe('QT-FE-008: invalidación de caché tras mutaciones', () => {
  it('useComprarTicket invalida tickets del usuario y evento', async () => {
    const { invalidar, wrapper } = preparar()
    const { result } = renderHook(() => useComprarTicket(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({
        userEmail: 'andrea@example.com',
        eventCode: 'CMF-2026',
        type: 'VIP',
      })
    })
    expect(invalidar).toHaveBeenCalledWith({
      queryKey: CLAVES.ticketsUsuario('andrea@example.com'),
    })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: CLAVES.evento('CMF-2026') })
  })

  it('useCancelarTicket invalida tickets, ticket y pagados', async () => {
    const { invalidar, wrapper } = preparar()
    const { result } = renderHook(() => useCancelarTicket(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({
        ticketCode: 'TKT-AND-001',
        eventCode: 'CMF-2026',
        email: 'andrea@example.com',
      })
    })
    expect(invalidar).toHaveBeenCalledWith({
      queryKey: CLAVES.ticketsUsuario('andrea@example.com'),
    })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: CLAVES.ticket('TKT-AND-001') })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: CLAVES.ticketsPagados('CMF-2026') })
  })

  it('useUsarTicket invalida ticket y pagados', async () => {
    const { invalidar, wrapper } = preparar()
    const { result } = renderHook(() => useUsarTicket(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({
        ticketCode: 'TKT-AND-001',
        eventCode: 'CMF-2026',
      })
    })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: CLAVES.ticket('TKT-AND-001') })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: CLAVES.ticketsPagados('CMF-2026') })
  })

  it('useCrearEvento siembra el evento e invalida su clave', async () => {
    const { queryClient, invalidar, wrapper } = preparar()
    const { result } = renderHook(() => useCrearEvento(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({
        eventCode: 'CMF-2026',
        name: 'Caribbean Music Fest 2026',
        description: 'Descripción de prueba',
        category: 'MUSIC',
        eventDate: '2027-12-15T20:00',
        minimumAge: 18,
        venueCode: 'VEN-SMR-01',
      })
    })
    expect(queryClient.getQueryData(CLAVES.evento('CMF-2026'))).toMatchObject({
      eventCode: 'CMF-2026',
    })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: CLAVES.evento('CMF-2026') })
  })

  it('usePublicarEvento invalida evento y catálogo', async () => {
    const { invalidar, wrapper } = preparar()
    const { result } = renderHook(() => usePublicarEvento(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('CMF-2026')
    })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: CLAVES.evento('CMF-2026') })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: CLAVES.eventosPublicados })
  })

  it('useAsociarArtista invalida evento y eventos por artista', async () => {
    const { invalidar, wrapper } = preparar()
    const { result } = renderHook(() => useAsociarArtista(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({
        eventCode: 'CMF-2026',
        artistId: 1,
        stageName: 'Solar Beat',
      })
    })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: CLAVES.evento('CMF-2026') })
    expect(invalidar).toHaveBeenCalledWith({
      queryKey: CLAVES.eventosPorArtista('Solar Beat'),
    })
  })
})

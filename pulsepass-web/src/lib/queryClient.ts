import { QueryClient } from '@tanstack/react-query'

function esErrorCliente(error: Error): boolean {
  const estado = (error as { status?: unknown }).status
  return typeof estado === 'number' && estado >= 400 && estado < 500
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (intentos, error) => (esErrorCliente(error as Error) ? false : intentos < 1),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

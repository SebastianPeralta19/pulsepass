import { useMutation } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import type { LoginRequest } from './tipos'

export function useLogin() {
  const { iniciarSesion } = useAuth()
  return useMutation({
    mutationFn: (datos: LoginRequest) => iniciarSesion(datos.identifier, datos.password),
  })
}

export function useSesion() {
  return useAuth().sesion
}

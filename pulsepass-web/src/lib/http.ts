import type { z } from 'zod'
import { ErrorResponseSchema, TokenGuardadoSchema } from '../funcionalidades/auth/tipos'
import type { TokenGuardado } from '../funcionalidades/auth/tipos'

const CLAVE_TOKEN = 'pulsepass.token'
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

let tokenEnMemoria: TokenGuardado | null = null
let manejador401: (() => void) | null = null

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function registrarManejador401(manejador: (() => void) | null) {
  manejador401 = manejador
}

export function notificar401() {
  manejador401?.()
}

function leerToken(): TokenGuardado | null {
  if (tokenEnMemoria) return tokenEnMemoria
  if (typeof window === 'undefined') return null
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_TOKEN)
    if (!crudo) return null
    const parseado = JSON.parse(crudo) as unknown
    const validado = TokenGuardadoSchema.safeParse(parseado)
    if (!validado.success || validado.data.expiraEn <= Date.now()) {
      window.sessionStorage.removeItem(CLAVE_TOKEN)
      return null
    }
    tokenEnMemoria = validado.data
    return validado.data
  } catch {
    window.sessionStorage.removeItem(CLAVE_TOKEN)
    return null
  }
}

export function obtenerToken(): string | null {
  return leerToken()?.token ?? null
}

export function guardarToken(token: string, expiraEn: number) {
  const dato: TokenGuardado = { token, expiraEn }
  tokenEnMemoria = dato
  try {
    window.sessionStorage.setItem(CLAVE_TOKEN, JSON.stringify(dato))
  } catch {
    return
  }
}

export function limpiarToken() {
  tokenEnMemoria = null
  try {
    window.sessionStorage.removeItem(CLAVE_TOKEN)
  } catch {
    return
  }
}

export function conParametros(
  ruta: string,
  parametros: Record<string, string | number | undefined>,
): string {
  const busca = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== '') busca.set(clave, String(valor))
  }
  const cadena = busca.toString()
  return cadena ? `${ruta}?${cadena}` : ruta
}

type Metodo = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

interface OpcionesHttp<T> {
  metodo?: Metodo
  cuerpo?: unknown
  esquema?: z.ZodType<T>
  autenticado?: boolean
}

function mensajeGenerico(status: number): string {
  if (status === 400) return 'Revisa los datos del formulario.'
  if (status === 401) return 'Tu sesión expiró.'
  if (status === 403) return 'No tienes permisos para esta acción.'
  if (status === 404) return 'No encontramos el recurso solicitado.'
  if (status >= 500) return 'Ocurrió un error inesperado. Inténtalo más tarde.'
  return 'No pudimos completar la solicitud.'
}

function convertirError(status: number, crudo: unknown): ApiError {
  const validado = ErrorResponseSchema.safeParse(crudo)
  if (validado.success) {
    return new ApiError(validado.data.status, validado.data.message, validado.data.details)
  }
  return new ApiError(status, mensajeGenerico(status))
}

export async function http<T>(ruta: string, opciones: OpcionesHttp<T> = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, esquema, autenticado = false } = opciones
  const cabeceras: Record<string, string> = { Accept: 'application/json' }
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json'
  if (autenticado) {
    const token = obtenerToken()
    if (token) cabeceras.Authorization = `Bearer ${token}`
  }

  let respuesta: Response
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    throw new ApiError(0, 'No pudimos conectar con el servidor.')
  }

  let datos: unknown = null
  if (respuesta.status !== 204) {
    try {
      datos = await respuesta.json()
    } catch {
      datos = null
    }
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401) notificar401()
    throw convertirError(respuesta.status, datos)
  }

  if (!esquema) return datos as T
  const validado = esquema.safeParse(datos)
  if (!validado.success) {
    throw new ApiError(respuesta.status, 'La respuesta del servidor no es válida.')
  }
  return validado.data
}

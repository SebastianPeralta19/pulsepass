import { z } from 'zod'

export const UserResponseSchema = z
  .object({
    id: z.number().int(),
    username: z.string(),
    email: z.string(),
    active: z.boolean(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().nullable(),
    city: z.string().nullable(),
    birthDate: z.string().nullable(),
  })
  .passthrough()
export type UserResponse = z.infer<typeof UserResponseSchema>

export const RegistroUsuarioSchema = z.object({
  username: z.string().trim().min(1, 'El nombre de usuario es obligatorio').max(100),
  email: z.string().trim().min(1, 'El correo es obligatorio').email('Correo inválido').max(150),
  firstName: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  lastName: z.string().trim().min(1, 'El apellido es obligatorio').max(100),
  birthDate: z
    .string()
    .min(1, 'La fecha de nacimiento es obligatoria')
    .refine((valor) => !Number.isNaN(Date.parse(valor)), 'Fecha inválida')
    .refine((valor) => Date.parse(valor) <= Date.now(), 'La fecha no puede ser futura'),
  password: z
    .string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres')
    .refine(
      (valor) => new TextEncoder().encode(valor).length <= 72,
      'La contraseña no puede superar 72 bytes UTF-8',
    ),
})
export type RegistroUsuarioForm = z.infer<typeof RegistroUsuarioSchema>

export function fortalezaPassword(valor: string): { texto: string; porcentaje: number } {
  if (valor.length === 0) return { texto: '—', porcentaje: 0 }
  const longitud = valor.length >= 12 ? 1 : valor.length / 12
  const variedad =
    (/[a-z]/.test(valor) ? 0.25 : 0) +
    (/[A-Z]/.test(valor) ? 0.25 : 0) +
    (/[0-9]/.test(valor) ? 0.25 : 0) +
    (/[^A-Za-z0-9]/.test(valor) ? 0.25 : 0)
  const porcentaje = Math.min(100, Math.round(((longitud + variedad) / 2) * 100))
  return {
    texto: porcentaje >= 75 ? 'alta' : porcentaje >= 45 ? 'media' : 'baja',
    porcentaje,
  }
}

import type { FormEventHandler } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import Boton from './Boton'
import Campo from './Campo'
import ContrasenaConFortaleza from './ContrasenaConFortaleza'
import { RegistroUsuarioSchema } from '../funcionalidades/usuarios/tipos'

export const EsquemaRegistro = RegistroUsuarioSchema.extend({
  confirmacion: z.string().min(1, 'Confirma tu contraseña'),
}).refine((datos) => datos.password === datos.confirmacion, {
  path: ['confirmacion'],
  message: 'Las contraseñas no coinciden',
})

export type RegistroForm = z.infer<typeof EsquemaRegistro>

export const CAMPOS_REGISTRO: readonly (keyof RegistroForm)[] = [
  'username',
  'email',
  'firstName',
  'lastName',
  'birthDate',
  'password',
  'confirmacion',
]

export default function FormularioRegistro({
  form,
  onEnviar,
  fuerza,
  visible,
  alAlternar,
  cargando,
}: {
  form: UseFormReturn<RegistroForm>
  onEnviar: FormEventHandler<HTMLFormElement>
  fuerza: { texto: string; porcentaje: number }
  visible: boolean
  alAlternar: () => void
  cargando: boolean
}) {
  const { register, formState } = form
  const { errors } = formState

  return (
    <form onSubmit={onEnviar} className="mt-6 space-y-4" noValidate>
      <Campo
        etiqueta="Nombre de usuario"
        autoComplete="username"
        autoCapitalize="none"
        {...register('username')}
        error={errors.username?.message}
      />
      <Campo
        etiqueta="Correo electrónico"
        type="email"
        autoComplete="email"
        {...register('email')}
        error={errors.email?.message}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Nombres"
          autoComplete="given-name"
          {...register('firstName')}
          error={errors.firstName?.message}
        />
        <Campo
          etiqueta="Apellidos"
          autoComplete="family-name"
          {...register('lastName')}
          error={errors.lastName?.message}
        />
      </div>
      <Campo
        etiqueta="Fecha de nacimiento"
        type="date"
        autoComplete="bday"
        {...register('birthDate')}
        error={errors.birthDate?.message}
      />
      <ContrasenaConFortaleza fuerza={fuerza} visible={visible} alAlternar={alAlternar}>
        <Campo
          etiqueta="Contraseña (mín. 12)"
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          className="pr-12"
          {...register('password')}
          error={errors.password?.message}
        />
      </ContrasenaConFortaleza>
      <Campo
        etiqueta="Confirmar contraseña"
        type="password"
        autoComplete="new-password"
        {...register('confirmacion')}
        error={errors.confirmacion?.message}
      />
      <Boton type="submit" cargando={cargando} className="w-full">
        Crear cuenta
      </Boton>
    </form>
  )
}

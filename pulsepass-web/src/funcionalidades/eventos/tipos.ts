import { z } from 'zod'
import { ArtistResponseSchema } from '../artistas/tipos'

export const EventCategorySchema = z.enum([
  'MUSIC',
  'SPORTS',
  'TECHNOLOGY',
  'EDUCATION',
  'CULTURE',
  'ENTERTAINMENT',
])
export type EventCategory = z.infer<typeof EventCategorySchema>

export const EventStatusSchema = z.enum([
  'DRAFT',
  'PUBLISHED',
  'SOLD_OUT',
  'CANCELLED',
  'FINISHED',
])
export type EventStatus = z.infer<typeof EventStatusSchema>

export const EventSummaryResponseSchema = z
  .object({
    id: z.number().int(),
    eventCode: z.string(),
    name: z.string(),
    category: EventCategorySchema,
    status: EventStatusSchema,
    eventDate: z.string(),
    venueCode: z.string().nullable(),
    venueName: z.string().nullable(),
  })
  .passthrough()
export type EventSummaryResponse = z.infer<typeof EventSummaryResponseSchema>

export const EventResponseSchema = EventSummaryResponseSchema.extend({
  description: z.string().nullable(),
  minimumAge: z.number().int().nullable(),
  artists: z.array(ArtistResponseSchema),
}).passthrough()
export type EventResponse = z.infer<typeof EventResponseSchema>

export const CrearEventoSchema = z.object({
  eventCode: z.string().trim().min(1, 'El código es obligatorio').max(50),
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
  description: z.string().max(1000, 'La descripción no puede superar 1000 caracteres'),
  category: EventCategorySchema,
  eventDate: z.string().min(1, 'La fecha es obligatoria'),
  minimumAge: z.coerce
    .number()
    .int('Debe ser un entero')
    .min(0, 'Debe ser mayor o igual que 0'),
  venueCode: z.string().min(1, 'Selecciona una sede'),
})
export type CrearEventoForm = z.infer<typeof CrearEventoSchema>

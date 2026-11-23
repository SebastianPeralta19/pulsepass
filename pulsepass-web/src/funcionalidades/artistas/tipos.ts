import { z } from 'zod'

export const ArtistResponseSchema = z
  .object({
    id: z.number().int(),
    stageName: z.string(),
    country: z.string().nullable(),
    genre: z.string().nullable(),
    active: z.boolean(),
  })
  .passthrough()
export type ArtistResponse = z.infer<typeof ArtistResponseSchema>

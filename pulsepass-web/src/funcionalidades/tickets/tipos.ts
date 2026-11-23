import { z } from 'zod'

export const TicketTypeSchema = z.enum(['GENERAL', 'VIP', 'BACKSTAGE', 'STUDENT'])
export type TicketType = z.infer<typeof TicketTypeSchema>

export const TicketStatusSchema = z.enum(['RESERVED', 'PAID', 'CANCELLED', 'USED'])
export type TicketStatus = z.infer<typeof TicketStatusSchema>

export const TicketResponseSchema = z
  .object({
    id: z.number().int(),
    ticketCode: z.string(),
    type: TicketTypeSchema,
    price: z.number(),
    status: TicketStatusSchema,
    purchaseDate: z.string(),
    userEmail: z.string(),
    eventCode: z.string(),
    eventName: z.string(),
  })
  .passthrough()
export type TicketResponse = z.infer<typeof TicketResponseSchema>

export const ComprarTicketSchema = z.object({
  type: TicketTypeSchema,
})
export type ComprarTicketForm = z.infer<typeof ComprarTicketSchema>

export const BuscarTicketSchema = z.object({
  ticketCode: z.string().trim().min(1, 'Ingresa un código de ticket'),
})
export type BuscarTicketForm = z.infer<typeof BuscarTicketSchema>

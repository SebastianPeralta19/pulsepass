import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import Aviso from '../../componentes/Aviso'
import Boton from '../../componentes/Boton'
import Modal from '../../componentes/Modal'
import Selector from '../../componentes/Selector'
import { useAuth } from '../auth/AuthContext'
import { useComprarTicket } from './hooks'
import { TicketTypeSchema } from './tipos'
import { ApiError } from '../../lib/http'
import { RUTAS } from '../../lib/rutas'

const OPCIONES_TIPO = TicketTypeSchema.options.map((tipo) => ({
  valor: tipo,
  etiqueta: tipo,
}))

function mensajeCompra(error: unknown): { mensaje: string; detalleTipo: string } {
  if (!(error instanceof ApiError)) {
    return { mensaje: 'Ocurrió un error inesperado. Inténtalo más tarde.', detalleTipo: '' }
  }
  if (error.status === 409) return { mensaje: error.message, detalleTipo: '' }
  if (error.status === 403 || error.status === 404) {
    return { mensaje: 'Ticket no disponible', detalleTipo: '' }
  }
  if (error.status === 400) {
    const detalleTipo = error.details.type ?? ''
    return {
      mensaje: Object.values(error.details).join(' ') || error.message || 'Revisa los datos.',
      detalleTipo,
    }
  }
  if (error.status === 0) {
    return { mensaje: 'No pudimos conectar con el servidor. Inténtalo más tarde.', detalleTipo: '' }
  }
  if (error.status >= 500) {
    return { mensaje: 'Ocurrió un error inesperado. Inténtalo más tarde.', detalleTipo: '' }
  }
  return { mensaje: error.message, detalleTipo: '' }
}

export default function ComprarTicket({ eventCode }: { eventCode: string }) {
  const { sesion } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const mutacion = useComprarTicket()
  const [abierto, setAbierto] = useState(false)
  const [tipo, setTipo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [detalleTipo, setDetalleTipo] = useState('')
  const email = sesion.estado === 'autenticado' ? sesion.usuario.email : ''
  const autenticado = sesion.estado === 'autenticado'
  const esUser = autenticado && sesion.usuario.roles.includes('USER')

  const cerrar = useCallback(() => {
    setAbierto(false)
    setTipo('')
    setMensaje('')
    setDetalleTipo('')
  }, [])

  function abrir() {
    setMensaje('')
    setDetalleTipo('')
    if (!autenticado) {
      const desde = `${ubicacion.pathname}${ubicacion.search}${ubicacion.hash}`
      navegar(RUTAS.login, { state: { desde } })
      return
    }
    if (!esUser) return
    setAbierto(true)
  }

  async function enviar() {
    const validado = TicketTypeSchema.safeParse(tipo)
    if (!validado.success) {
      setMensaje('Selecciona un tipo de ticket.')
      return
    }
    setMensaje('')
    setDetalleTipo('')
    try {
      const ticket = await mutacion.mutateAsync({
        userEmail: email,
        eventCode,
        type: validado.data,
      })
      navegar(RUTAS.confirmacionCompra(ticket.ticketCode))
    } catch (error) {
      const resultado = mensajeCompra(error)
      setMensaje(resultado.mensaje)
      setDetalleTipo(resultado.detalleTipo)
    }
  }

  return (
    <div>
      <Boton onClick={abrir} className="w-full">
        Comprar entrada
      </Boton>
      {autenticado && !esUser ? (
        <div className="mt-3">
          <Aviso tipo="error" mensaje="Solo los usuarios USER pueden comprar entradas." />
        </div>
      ) : null}
      <Modal abierto={abierto} titulo="Comprar entrada" onCerrar={cerrar}>
        <form
          onSubmit={(evento) => {
            evento.preventDefault()
            void enviar()
          }}
          className="space-y-4"
        >
          <Selector
            etiqueta="Tipo de ticket"
            opciones={OPCIONES_TIPO}
            opcionVacia="Selecciona un tipo"
            value={tipo}
            error={detalleTipo}
            onChange={(evento) => setTipo(evento.target.value)}
          />
          {mensaje ? <Aviso tipo="error" mensaje={mensaje} /> : null}
          <div className="flex flex-wrap justify-end gap-3">
            <Boton variante="secundario" onClick={cerrar}>
              Cancelar
            </Boton>
            <Boton type="submit" cargando={mutacion.isPending}>
              Confirmar compra
            </Boton>
          </div>
        </form>
      </Modal>
    </div>
  )
}

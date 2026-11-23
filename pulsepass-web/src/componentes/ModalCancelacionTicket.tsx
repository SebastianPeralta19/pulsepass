import Aviso from './Aviso'
import Boton from './Boton'
import Modal from './Modal'

export default function ModalCancelacionTicket({
  abierto,
  mensaje,
  cancelando,
  onCerrar,
  onCancelar,
}: {
  abierto: boolean
  mensaje: string
  cancelando: boolean
  onCerrar: () => void
  onCancelar: () => void
}) {
  return (
    <Modal abierto={abierto} titulo="Confirmar cancelación" onCerrar={onCerrar}>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        ¿Seguro que deseas cancelar este ticket? Esta acción no se puede deshacer.
      </p>
      {mensaje ? (
        <div className="mt-4">
          <Aviso tipo="error" mensaje={mensaje} />
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Boton variante="secundario" onClick={onCerrar}>
          Volver
        </Boton>
        <Boton variante="peligro" cargando={cancelando} onClick={onCancelar}>
          Confirmar cancelación
        </Boton>
      </div>
    </Modal>
  )
}

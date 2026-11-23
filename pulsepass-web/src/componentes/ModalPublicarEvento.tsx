import Aviso from './Aviso'
import Boton from './Boton'
import Modal from './Modal'

export default function ModalPublicarEvento({
  abierto,
  nombre,
  aviso,
  publicando,
  onCerrar,
  onPublicar,
}: {
  abierto: boolean
  nombre: string
  aviso: { tipo: 'exito' | 'error'; mensaje: string } | null
  publicando: boolean
  onCerrar: () => void
  onPublicar: () => void
}) {
  return (
    <Modal abierto={abierto} titulo="Publicar evento" onCerrar={onCerrar}>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        ¿Seguro que deseas publicar «{nombre}»? El evento será visible al público.
      </p>
      {aviso?.tipo === 'error' ? (
        <div className="mt-4">
          <Aviso tipo="error" mensaje={aviso.mensaje} />
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Boton variante="secundario" onClick={onCerrar}>
          Cancelar
        </Boton>
        <Boton cargando={publicando} onClick={onPublicar}>
          Publicar
        </Boton>
      </div>
    </Modal>
  )
}

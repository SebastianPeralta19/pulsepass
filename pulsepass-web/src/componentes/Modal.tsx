import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import clsx from 'clsx'
import { IconoCerrar } from './Iconos'

interface ModalProps {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
  className?: string
}

const SELECTOR_FOCO =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({
  abierto,
  titulo,
  onCerrar,
  children,
  className,
}: ModalProps) {
  const tituloId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const anterior = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!abierto) return
    anterior.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const elementos = panel.current?.querySelectorAll<HTMLElement>(SELECTOR_FOCO)
    ;(elementos?.[0] ?? panel.current)?.focus()

    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        evento.preventDefault()
        onCerrar()
        return
      }
      if (evento.key !== 'Tab' || !panel.current) return
      const enfocables = Array.from(panel.current.querySelectorAll<HTMLElement>(SELECTOR_FOCO))
      if (enfocables.length === 0) {
        evento.preventDefault()
        panel.current.focus()
        return
      }
      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]
      if (!primero || !ultimo) return
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alPulsar)
    return () => {
      document.removeEventListener('keydown', alPulsar)
      anterior.current?.focus()
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className={clsx(
          'max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl focus:outline-none dark:bg-slate-900',
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={tituloId} className="font-titulo text-xl font-bold text-slate-900 dark:text-slate-100">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-slate-500 focus-visible:outline-2 focus-visible:outline-marca-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <IconoCerrar className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import ContrasenaVisible from './ContrasenaVisible'

export default function ContrasenaConFortaleza({
  visible,
  alAlternar,
  fuerza,
  children,
}: {
  visible: boolean
  alAlternar: () => void
  fuerza: { texto: string; porcentaje: number }
  children: ReactNode
}) {
  const niveles = Math.ceil(fuerza.porcentaje / 25)
  return (
    <div>
      <ContrasenaVisible visible={visible} alAlternar={alAlternar}>
        {children}
      </ContrasenaVisible>
      <div
        role="meter"
        aria-label="Fortaleza de la contraseña"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fuerza.porcentaje}
        aria-valuetext={fuerza.texto}
        className="mt-2 flex gap-1"
      >
        {[1, 2, 3, 4].map((nivel) => (
          <span
            key={nivel}
            aria-hidden="true"
            className={`h-2 flex-1 rounded ${
              nivel <= niveles ? 'bg-marca-600 dark:bg-marca-500' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Fortaleza: {fuerza.texto}
      </p>
    </div>
  )
}

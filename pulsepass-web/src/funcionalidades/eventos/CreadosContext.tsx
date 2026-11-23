import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export interface CreadosContextValue {
  codigos: string[]
  agregar: (eventCode: string) => void
}

const valorPorDefecto: CreadosContextValue = {
  codigos: [],
  agregar: () => undefined,
}

export const CreadosContext = createContext<CreadosContextValue>(valorPorDefecto)

export function useCreados(): CreadosContextValue {
  return useContext(CreadosContext)
}

export function CreadosProvider({ children }: { children: ReactNode }) {
  const [codigos, setCodigos] = useState<string[]>([])

  const agregar = useCallback((eventCode: string) => {
    const codigo = eventCode.trim()
    if (!codigo) return
    setCodigos((actuales) => (actuales.includes(codigo) ? actuales : [...actuales, codigo]))
  }, [])

  const valor = useMemo(() => ({ codigos, agregar }), [codigos, agregar])

  return <CreadosContext.Provider value={valor}>{children}</CreadosContext.Provider>
}

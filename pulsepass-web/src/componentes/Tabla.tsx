import type { ReactNode } from 'react'

export interface Columna<T> {
  encabezado: string
  celda: (fila: T) => ReactNode
  className?: string
}

interface TablaProps<T> {
  columnas: Columna<T>[]
  filas: T[]
  caption: string
  claveFila: (fila: T) => string
}

export default function Tabla<T>({
  columnas,
  filas,
  caption,
  claveFila,
}: TablaProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400">
            {columnas.map((columna, indice) => (
              <th key={`${columna.encabezado}-${indice}`} scope="col" className="px-3 py-2 font-semibold">
                {columna.encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr
              key={claveFila(fila)}
              className="border-b border-slate-100 last:border-0 dark:border-slate-800"
            >
              {columnas.map((columna, indice) => (
                <td key={`${columna.encabezado}-${indice}`} className={columna.className ?? 'px-3 py-3'}>
                  {columna.celda(fila)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

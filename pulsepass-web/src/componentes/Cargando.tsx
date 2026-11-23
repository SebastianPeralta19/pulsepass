export default function Cargando({
  etiqueta = 'Cargando contenido',
  lineas = 3,
}: {
  etiqueta?: string
  lineas?: number
}) {
  return (
    <div role="status" aria-busy="true" aria-label={etiqueta} className="space-y-3 p-4">
      <span className="sr-only">{etiqueta}</span>
      {Array.from({ length: lineas }, (_, indice) => (
        <div
          key={indice}
          className="h-16 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800"
        />
      ))}
    </div>
  )
}

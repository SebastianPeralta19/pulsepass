import clsx from 'clsx'

export function CodigoTexto({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <code
      className={clsx(
        'rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        className,
      )}
    >
      {children}
    </code>
  )
}

import { formatearCOP } from '../lib/formato'

export default function PrecioCOP({ valor }: { valor: number }) {
  return <span className="font-semibold tabular-nums">{formatearCOP(valor)}</span>
}

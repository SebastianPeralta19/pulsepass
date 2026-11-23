import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function PantallaPrueba() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-titulo text-3xl font-bold text-marca-600 dark:text-marca-500">
        PulsePass
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Frontend Fase 5</p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PantallaPrueba />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router/dom'
import './index.css'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './funcionalidades/auth/AuthContext'
import { CreadosProvider } from './funcionalidades/eventos/CreadosContext'
import { router } from './router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CreadosProvider>
          <RouterProvider router={router} />
        </CreadosProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)

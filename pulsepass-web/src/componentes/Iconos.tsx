import type { SVGProps } from 'react'

type IconoProps = SVGProps<SVGSVGElement>

function Base({ children, className, ...props }: IconoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconoMusica(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M9 18V5l10-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </Base>
  )
}

export function IconoBuscar(props: IconoProps) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Base>
  )
}

export function IconoUbicacion(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </Base>
  )
}

export function IconoCalendario(props: IconoProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </Base>
  )
}

export function IconoUsuario(props: IconoProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Base>
  )
}

export function IconoAdvertencia(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M10.3 3.8 2.5 17.2A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </Base>
  )
}

export function IconoCheck(props: IconoProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </Base>
  )
}

export function IconoCerrar(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Base>
  )
}

export function IconoMenu(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Base>
  )
}

export function IconoOjo(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </Base>
  )
}

export function IconoOjoCerrado(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M3 3l18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.3 3.9M6.2 8.2A16.8 16.8 0 0 0 2 12s3.6 6 10 6a10.6 10.6 0 0 0 4-.8" />
    </Base>
  )
}

export function IconoCopiar(props: IconoProps) {
  return (
    <Base {...props}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Base>
  )
}

export function IconoFlechaIzquierda(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="m15 18-6-6 6-6" />
    </Base>
  )
}

export function IconoFlechaDerecha(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="m9 18 6-6-6-6" />
    </Base>
  )
}

export function IconoPlus(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  )
}

export function IconoEntrada(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
      <path d="M12 6v2M12 11v2M12 16v2" />
    </Base>
  )
}

export function IconoSol(props: IconoProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </Base>
  )
}

export function IconoLuna(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10Z" />
    </Base>
  )
}

export function IconoCorreo(props: IconoProps) {
  return (
    <Base {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </Base>
  )
}

export function IconoEstrella(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9L12 3Z" />
    </Base>
  )
}

export function IconoDocumento(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
      <path d="M14 3v6h6M8 13h8M8 17h8" />
    </Base>
  )
}

export function IconoDeporte(props: IconoProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c3 3 3 15 0 18M3 12h18" />
    </Base>
  )
}

export function IconoTecnologia(props: IconoProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </Base>
  )
}

export function IconoEducacion(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="m2 9 10-5 10 5-10 5-10-5Z" />
      <path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
    </Base>
  )
}

export function IconoCultura(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-6h4v6" />
    </Base>
  )
}

export function IconoEntretenimiento(props: IconoProps) {
  return (
    <Base {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="m8 7 4-4 4 4M9 12h.01M15 12h.01M9 16h6" />
    </Base>
  )
}

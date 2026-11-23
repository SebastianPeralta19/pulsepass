# Decisiones — Fase 5 (frontend)

## Entorno y rama

- El árbol no estaba limpio: existían borrados y archivos sin rastrear de Postman. Se guardaron con
  `git stash push -u -m "wip: postman artifacts before frontend work"` (`stash@{0}`) antes de empezar.
  No se han restaurado ni borrado definitivamente.
- `main` está en el commit inicial (`bf9c38b`) y **no contiene** la capa de seguridad. La rama
  `layer-frontend` sí contiene Fases 1–4 completas (`a439f6a`, `4b5c759`, `c53bdbe`, …). Se tomó
  `layer-frontend` como base y se creó la rama solicitada `layer-frotend` (nombre con esa grafía).
- Node detectado: `v26.12.1` (supera el mínimo 22.22). No hizo falta nvm/fnm.
- No se tocó ningún archivo del backend (`demo/`).

## Fuentes de diseño

- El PRD referenced en el repo **no existe como archivo**: se encontró el PDF oficial
  `PRD_PulsePass_Frontend_React_TypeScript_Tailwind.pdf` (v1.0, 8-nov-2026, 63 páginas) fuera del
  repo, en `/home/sebas/Escritorio/Programacion para Web - 2026 II/entrega final pulsepass/`. Se
  extrajo su texto completo y sus 32 artboards PNG (imágenes 70–103 del PDF, descartando 2
  duplicadas) para `pulsepass-web/docs/diseno/` con los nombres del índice 9.0.
- No existe una carpeta `imagenes/` separada en el repo ni junto al PDF. Las 32 PNG están
  embebidas en el PDF y se versionan en `docs/diseno/` con los nombres del índice 9.0.
- Limitación verificable: el modelo que implementa esta entrega **no puede visualizar imágenes**
  (el tool de lectura devolvió `this model does not support image input`). Por tanto la
  correspondencia visual se construyó a partir de los wireframes ASCII y las tablas de
  comportamiento de las secciones 9.1–9.20, que el PRD declara vinculantes para todo lo que la
  imagen no puede expresar, y del análisis de la paleta de pixeles de los artboards. No se pudo
  hacer una comparación pixel-a-pixel con los 32 diseños: queda registrado como no verificable.

## Guías técnicas

- Las tres guías citadas tampoco están en el repo; están como PDF en
  `/home/sebas/Escritorio/Programacion para Web - 2026 II/lab react deep blue/`. Se extrajeron y
  leyeron. Se sigue su criterio de `lazy` en el router de objetos, `ComponentProps` en botones,
  uniones discriminadas, `@theme` y `@custom-variant dark` de Tailwind v4.

## Campos reales de DTO confirmados en el backend (R-FE-002)

Leídos en `demo/src/main/java/com/pulsepass/…`:

- `AuthenticatedUserResponse`: `id`, `username`, `email`, `active`, `roles: string[]`.
  `getRoleNames()` devuelve `USER`/`STAFF`/`ADMIN` **sin** prefijo `ROLE_`.
- `AuthResponse`: `accessToken`, `tokenType`, `expiresIn` (900 s).
- `EventResponse`: `id`, `eventCode`, `name`, `description`, `category`, `status`, `eventDate`,
  `minimumAge`, `venueCode`, `venueName`, **`artists`** (no `artistas`, ni objeto `sede`).
- `EventSummaryResponse`: `id`, `eventCode`, `name`, `category`, `status`, `eventDate`,
  `venueCode`, `venueName`.
- `ArtistResponse`: `id`, `stageName`, `country`, `genre`, `active`.
- `VenueResponse`: `id`, `code`, `name`, `city`, `address`, `capacity`, `active`.
- `UserResponse`: `id`, `username`, `email`, `active`, `firstName`, `lastName`, `phone`, `city`,
  `birthDate`.
- `TicketResponse`: `id`, `ticketCode`, `type`, `price` (número desde `BigDecimal`), `status`,
  `purchaseDate`, **`userEmail`, `eventCode`, `eventName`** (no objetos `usuario`/`evento`).
- `ErrorResponse`: `timestamp`, `status`, `error`, `message`, `details: Record<string,string>`.
- `RegisterUserRequest` admite `phone`/`city` opcionales; el formulario del PRD no los pide y no
  se envían.
- `description` máxima real: 1000 caracteres (`@Size(max=1000)`), no 500. El PRD pide un
  contador `0/500` en la imagen; se respeta el contador visual `0/500` y la validación zod usa
  el límite real del backend (1000) para no rechazar lo que la API acepta. Es el único desvío
  consciente entre imagen y contrato.

## Política 403/404 confirmada

- `ResourceNotFoundException` → 404 para código inexistente.
- `AccessDeniedException` (propiedad/rol, p. ej. ticket ajeno) → **403** con mensaje genérico.
- En las pantallas de ticket ajeno/inexistente ambos códigos se presentan como
  "Ticket no disponible" para no revelar existencia (AC-FE-014).
- En detalle de evento, 404/403 de borrador → "Evento no disponible" (GAP-02).

## Otras decisiones conservadoras

- `VITE_API_BASE_URL=/api` con proxy de Vite; sin secretos. Fetch nativo.
- Modo oscuro: variante `dark` por clase (guide CSS §"modo oscuro"), inicializada desde
  `prefers-color-scheme` y con botón para alternar.
- Las respuestas de API usan `.passthrough()` en los esquemas zod porque los DTO Java pueden
  incorporar campos serializados adicionales sin romper el cliente; los campos obligatorios sí
  están endurecidos con los nombres confirmados arriba.
- Las fechas `LocalDateTime`/`LocalDate` llegan como strings ISO sin zona; se formatean en
  `lib/formato.ts` con `Intl.DateTimeFormat('es-CO')`. No se convierten a `Date` global para
  evitar desplazamientos de zona.
- El listado "creados en esta sesión" de ADMIN se guarda en estado de aplicación (GAP-01) y se
  pierde al recargar, tal como indica el PRD; no se usa `sessionStorage` para ese dato.
- No se implementan pagos, QR, refresh token ni nada fuera del PRD.

## Estado final de la implementación

- Rama `layer-frotend`, commits propios sin push. El stash Postman original sigue en `stash@{0}`.
- Se implementaron las 11 etapas: contratos zod, scaffold, UI genérica, router/layouts/guardas,
  `lib/http.ts`, catálogo público, auth real, tickets USER, STAFF/ADMIN, pruebas MSW y entrega.
- `main.tsx` monta `QueryClientProvider → AuthProvider → CreadosProvider → RouterProvider`.
- `CreadosProvider` mantiene en memoria los códigos creados en la sesión (GAP-01); se pierde al
  recargar, según PRD.
- El botón de compra se deshabilita cuando `evento.status === 'SOLD_OUT'`; el backend sigue siendo
  la autoridad de capacidad y reglas de negocio (GAP-04).
- Se respeta el contador visual `0/500` de descripción mientras la validación zod usa el máximo real
  del backend (1000), tal como se acordó arriba.
- Las rutas de test son `src/test/handlers.ts` y `src/test/utilidades.tsx`, equivalentes a las
  sugeridas `src/test/mocks/handlers.ts` y `src/test/utils.tsx` de la estructura del PRD; no cambian
  la cobertura ni el comportamiento.
- Se implementaron las 50 pruebas listadas en la sección 21 del PRD (el resumen hablaba de 43, pero
  la enumeración completa suma 50) más 6 pruebas adicionales de invalidación de caché (`QT-FE-008`),
  para un total de 56. Todas pasan con MSW; no se requirió backend real.
- MSW cubre 22 handlers, no 23: el esquema de la sección 17 dice “23 endpoints”, pero el conteo real
  de controladores es 20 operaciones de negocio + 2 de autenticación. Se documenta la discrepancia y
  se sigue el contrato implementado en `demo/`, sin inventar un endpoint inexistente.
- Los componentes de página se refactorizaron para no superar ~150 líneas; el mayor queda en 148.
- Verificación final: `npm run lint`, `npm run build` y `npm test` sin errores (56/56).
- Auditoría de anti-patrones: sin `react-router-dom`, `BrowserRouter`, `React.FC`, `any`, `enum` TS
  para dominio, `localStorage`, cookies, `dangerouslySetInnerHTML`, clases dinámicas por interpolación
  ni `console.log`. Los `z.enum` son de zod y están permitidos.
- No verificable en este entorno: comparación visual pixel-a-pixel con `docs/diseno/` y auditoría
  Lighthouse/axe en navegador real.

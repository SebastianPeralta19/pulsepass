# PulsePass Frontend (Fase 5)

Frontend React + TypeScript + Tailwind v4 para PulsePass. Consume la API REST de Fase 3/4 ubicada en `demo/`; el backend no se modifica desde este proyecto.

## Requisitos

- Node.js 22.22+ (verificado con v26.12.1).
- npm 10+.
- Backend PulsePass en `http://localhost:8080` para desarrollo con API real. Sin backend, la UI funciona con MSW en pruebas.

## Instalación y comandos

Desde `pulsepass-web/`:

```bash
npm install
cp .env.example .env
npm run dev
```

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor Vite en `http://localhost:5173`; proxy `/api` → `http://localhost:8080`. |
| `npm run build` | `tsc --noEmit` estricto + build de producción. |
| `npm run lint` | ESLint sobre todo el proyecto. |
| `npm test` | Vitest con jsdom y MSW; 56 pruebas sin red real. |

## Configuración

`.env.example` define únicamente:

```env
VITE_API_BASE_URL=/api
```

No hay secretos en el bundle. En pruebas Vitest usa `http://localhost/api` para que MSW pueda interceptar `fetch`. El token JWT viaja solo en `Authorization: Bearer <token>` y se guarda en `sessionStorage` y memoria; nunca en URL, `localStorage`, cookies ni logs.

## Roles de demostración

| Persona | Rol de UI | Uso principal |
| --- | --- | --- |
| Andrea / Carlos | `USER` | Comprar, ver y cancelar tickets; consultar Mi cuenta. |
| Laura | `STAFF` | Validar ingreso y consultar tickets pagados de un evento. |
| Administración | `ADMIN` | Crear/publicar eventos y asociar artistas. |
| Miguel | `USER` inactivo | El backend rechaza el login (401). |

La UI nunca decodifica el JWT para decidir permisos: los roles vienen de `GET /api/auth/me`.

## Rutas principales

| Ruta | Página | Acceso |
| --- | --- | --- |
| `/` | Inicio | Público |
| `/eventos`, `/eventos/:eventCode` | Cartelera y detalle | Público |
| `/artistas`, `/artistas/:id` | Artistas | Público |
| `/sedes`, `/sedes/:code` | Sedes | Público |
| `/login`, `/registro` | Autenticación | Solo anónimos |
| `/cuenta` | Mi cuenta | Autenticado |
| `/mis-tickets`, `/mis-tickets/:ticketCode`, `/compra/confirmacion/:ticketCode` | Tickets | `USER` |
| `/staff/validacion`, `/staff/eventos/:eventCode/tickets` | Operación | `STAFF`/`ADMIN` |
| `/admin/eventos`, `/admin/eventos/nuevo`, `/admin/eventos/:eventCode` | Administración | `ADMIN` |
| `/403`, `*` | Error de permisos / 404 | Todos |

## Arquitectura

```text
src/
├── main.tsx                 QueryClientProvider · AuthProvider · CreadosProvider · RouterProvider
├── router.tsx               createBrowserRouter con lazy, guardas y errorElement
├── lib/                     http.ts, rutas.ts, formato.ts, consultas.ts, queryClient.ts
├── layouts/                 Layout, RutaProtegida, RutaPorRol, SoloAnonimo
├── componentes/             UI genérica y subcomponentes de presentación
├── funcionalidades/         auth, eventos, artistas, sedes, usuarios, tickets: api/tipos/hooks
├── pages/                   páginas de ruta
└── test/                    setup, MSW handlers, fixtures, utilidades y 56 pruebas
```

Flujo de datos: **página → hook de TanStack Query → api.ts → lib/http.ts → API**. Las respuestas externas se validan con zod y los tipos se derivan con `z.infer`. Los errores pasan por `ApiError` (`status`, `message`, `details`).

## Errores y sesión

| Código | Comportamiento de UI |
| --- | --- |
| Red | “No pudimos conectar con el servidor.” + reintento. |
| 400 | `details` a campos del formulario; si no hay, aviso general. |
| 401 | Login: “Credenciales inválidas”. Otras rutas: cierre local, caché limpia y `/login` con “Tu sesión expiró”. |
| 403 | `/403` en cargas de página; aviso en acciones. En tickets ajenos: “Ticket no disponible”. |
| 404 | “No encontramos esta página” o “Evento no disponible” / “Ticket no disponible” según contexto. |
| 409 | Mensaje del backend en aviso/modal, sin cerrar el modal. |
| 500 | “Ocurrió un error inesperado. Inténtalo más tarde.” |

El token se restaura al abrir la pestaña, se valida con zod y se descarta si expiró; también se programa cierre local a los 900 s. `cerrarSesion()` limpia token y `queryClient.clear()`.

## Pruebas

`npm test` ejecuta 56 pruebas (todas las IDs `TEST-FE-*` del PRD) con MSW cubriendo las 22 operaciones reales confirmadas en los controladores (20 de negocio + 2 de autenticación). El esquema del PRD menciona “23 endpoints”, pero el conteo de `@RequestMapping` del backend da 22; se sigue el backend. `renderConProveedores` monta QueryClient, AuthContext, CreadosProvider y MemoryRouter. No se usa backend real ni reloj fijo distinto del necesario para tokens.

## Diseño y limitaciones

- Los 32 artboards del PRD están en `docs/diseno/`. La implementación se apoyó en wireframes y tablas de comportamiento por limitación de visualización de imágenes; no se realizó comparación pixel-a-pixel.
- Modo oscuro por clase `.dark`, inicializado desde `prefers-color-scheme` y con interruptor accesible en el navbar.
- No se implementaron pagos, QR, refresh token, MFA ni recuperación de contraseña, fuera del alcance del PRD.
- `Lighthouse`/`axe` no se ejecutaron en este entorno; la accesibilidad se verificó mediante foco visible, etiquetas, roles ARIA, navegación por teclado y tests de menú móvil.

Ver `DECISIONES.md` en la raíz del repositorio para suposiciones, brechas del backend y desvíos conscientes.

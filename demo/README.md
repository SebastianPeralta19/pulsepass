# PulsePass

Plataforma de eventos, artistas y entradas. Caso de estudio académico construido por capas:

1. **Persistencia**: entidades JPA, Flyway, PostgreSQL y Testcontainers.
2. **Servicios**: reglas de negocio, DTOs `record`, MapStruct, transacciones y excepciones propias.
3. **Controladores REST**: endpoints HTTP, Bean Validation y manejo global de errores.
4. **Seguridad**: Spring Security, JWT (JJWT), BCrypt, autorización por rol y por propiedad.

## Stack

Java 21 · Spring Boot 4 · Spring MVC · Spring Data JPA / Hibernate · PostgreSQL · Flyway · MapStruct · **Spring Security** · **JJWT 0.13 (HS256)** · JUnit 5 · Mockito · AssertJ · MockMvc · Testcontainers

## Arquitectura

```
Cliente HTTP → Filtro JWT → Controller → Service → Repository → PostgreSQL
                    ↓                        ↓
          EntryPoint / AccessDenied   AuthorizationService (propiedad)
                    ↓                        ↓
              ErrorResponse 401/403   GlobalExceptionHandler → ErrorResponse
```

- El Controller solo traduce HTTP. No contiene reglas de negocio ni accede a repositories.
- La autenticación (¿quién eres?) vive en la cadena de filtros; la autorización de recursos (¿puedes tocar *este* objeto?) vive en la frontera de negocio (`AuthorizationService`).
- Ningún endpoint expone entidades JPA: todo se transporta con DTOs.
- Los errores se centralizan en `GlobalExceptionHandler` (`@RestControllerAdvice`); los que ocurren antes del `DispatcherServlet` (cadena de filtros) usan el mismo contrato `ErrorResponse`.

## Seguridad

### Variables de entorno

| Variable | Descripción | Obligatoria |
|---|---|---|
| `PULSEPASS_JWT_SECRET_BASE64` | Clave HMAC en Base64 con al menos 32 bytes. **Sin valor por defecto**: la aplicación no arranca si falta o es débil. | Sí |
| `PULSEPASS_JWT_ISSUER` | Emisor (`iss`) exigido al validar. | No (`pulsepass-api`) |
| `PULSEPASS_JWT_ACCESS_TTL` | Duración ISO-8601 del token. | No (`PT15M`) |
| `PULSEPASS_CORS_ALLOWED_ORIGINS` | Orígenes permitidos separados por comas. Vacío = CORS deshabilitado (denegar por defecto). | No (vacío) |

Plantilla en `.env.example`. Generar una clave:

```bash
openssl rand -base64 32
```

### Modelo de identidad

| Tabla | Contenido |
|---|---|
| `users` | Datos de negocio del usuario (`username`, `email`, `active`). |
| `user_credentials` | Hash BCrypt (1:1 con `users`). Separado de `User` para que ninguna serialización lo exponga. |
| `user_roles` | Roles `USER`, `STAFF`, `ADMIN` (clave compuesta `user_id + role`). |

- En la base de datos los roles se guardan sin prefijo; Spring Security los expone como authorities `ROLE_USER`, `ROLE_STAFF`, `ROLE_ADMIN`.
- Los usuarios creados en las fases 1–3 quedan **sin credenciales** tras la migración `V4` y por lo tanto no pueden iniciar sesión. No se asigna ninguna contraseña por defecto; la activación es un proceso administrativo documentado en la propia migración.
- El registro público (`POST /api/users`) siempre crea la cuenta con `ROLE_USER`; `STAFF` y `ADMIN` solo se otorgan por un procedimiento controlado, nunca desde parámetros HTTP.

### Flujo de autenticación

1. `POST /api/auth/login` con `identifier` (usuario **o** correo) y `password`.
2. Se verifica contra `AuthenticationManager` + `BCryptPasswordEncoder`. Un fallo devuelve `401` genérico, sin revelar si el usuario existe.
3. Se emite un JWT firmado con HS256: `sub` = id persistente, `iss`, `iat`, `exp`, `jti`. La respuesta es `{ "accessToken": ..., "tokenType": "Bearer", "expiresIn": 900 }`.
4. Cada petición con `Authorization: Bearer <token>` valida firma, emisor y expiración, y **reconstruye** la identidad desde la base de datos (usuario, estado y roles vigentes). Los claims del token nunca sustituyen esa carga: un rol revocado deja de tener efecto en la siguiente petición.
5. Un token válido de un usuario **inactivo** se rechaza con `401`.

### Matriz de autorización

| Endpoint | Acceso |
|---|---|
| `POST /api/auth/login` | Público |
| `POST /api/users` (registro) | Público |
| `GET /api/events/published` | Público |
| `GET /api/events/{eventCode}` | Público (los borradores se ocultan como `404`) |
| `GET /api/events/by-artist` | Público (solo eventos publicados; STAFF/ADMIN ven borradores) |
| `GET /api/artists/**`, `GET /api/venues/**` | Público |
| `GET /api/auth/me` | Autenticado |
| `GET /api/users/by-email`, `GET /api/users/by-username` | Autenticado; **solo el propio usuario o ADMIN** |
| `POST /api/tickets` | Autenticado; el correo debe representar al usuario (o ADMIN) |
| `GET /api/tickets/{code}` | Propietario, o STAFF/ADMIN |
| `GET /api/tickets/by-user` | Propietario, o ADMIN |
| `PATCH /api/tickets/{code}/cancel` | Propietario, o ADMIN |
| `PATCH /api/tickets/{code}/use` | STAFF o ADMIN |
| `GET /api/events/{code}/tickets/paid` | STAFF o ADMIN |
| `POST /api/events` | ADMIN |
| `PATCH /api/events/{code}/publish` | ADMIN |
| `POST /api/events/{code}/artists/{artistId}` | ADMIN |

Regla por defecto: **todo lo no listado como público exige identidad**; una ruta protegida sin token devuelve `401` y un rol/propiedad insuficiente devuelve `403`.

### Política de respuesta ante recursos ajenos

- Identidad válida pero sin permiso → `403` con mensaje uniforme, sin detalles internos.
- Los recursos inexistentes y los borradores de evento → `404` (no se confirma si existen).
- La propiedad se decide **siempre** comparando el id persistente del principal; nunca se confía en identificadores enviados por el cliente.

### Limitaciones del MVP

- No hay *refresh tokens* ni revocación centralizada: un token vive hasta su `exp`.
- No hay bloqueo por intentos fallidos ni *rate limiting*.
- Los roles se recargan en cada petición (ventaja: cambios de rol inmediatos; coste: una consulta más por request).

## Endpoints

### Autenticación

| Método | Endpoint | Descripción | Acceso | Éxito |
|---|---|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión y obtener JWT | Público | 200 |
| GET | `/api/auth/me` | Datos mínimos del usuario autenticado | Bearer | 200 |

### Venues

| Método | Endpoint | Descripción | Acceso | Éxito |
|---|---|---|---|---|
| GET | `/api/venues/{code}` | Consultar venue por código | Público | 200 |
| GET | `/api/venues/active` | Listar venues activos | Público | 200 |

### Eventos

| Método | Endpoint | Descripción | Acceso | Éxito |
|---|---|---|---|---|
| POST | `/api/events` | Crear evento (inicia en `DRAFT`) | ADMIN | 201 |
| GET | `/api/events/{eventCode}` | Consultar evento por código | Público | 200 |
| GET | `/api/events/published` | Listar eventos publicados | Público | 200 |
| PATCH | `/api/events/{eventCode}/publish` | Publicar evento (`DRAFT → PUBLISHED`) | ADMIN | 200 |
| POST | `/api/events/{eventCode}/artists/{artistId}` | Asociar artista a un evento | ADMIN | 200 |
| GET | `/api/events/by-artist?stageName=...` | Eventos de un artista | Público | 200 |
| GET | `/api/events/{eventCode}/tickets/paid` | Tickets `PAID` de un evento | STAFF/ADMIN | 200 |

### Artistas

| Método | Endpoint | Descripción | Acceso | Éxito |
|---|---|---|---|---|
| GET | `/api/artists/{id}` | Consultar artista por ID | Público | 200 |
| GET | `/api/artists/by-stage-name?stageName=...` | Consultar por nombre artístico | Público | 200 |
| GET | `/api/artists/active` | Listar artistas activos | Público | 200 |

### Usuarios

| Método | Endpoint | Descripción | Acceso | Éxito |
|---|---|---|---|---|
| POST | `/api/users` | Registrar usuario con perfil y contraseña | Público | 201 |
| GET | `/api/users/by-email?email=...` | Consultar por email | Propietario/ADMIN | 200 |
| GET | `/api/users/by-username?username=...` | Consultar por username | Propietario/ADMIN | 200 |

### Tickets

| Método | Endpoint | Descripción | Acceso | Éxito |
|---|---|---|---|---|
| POST | `/api/tickets` | Comprar ticket (queda `PAID`) | Propietario/ADMIN | 201 |
| GET | `/api/tickets/{ticketCode}` | Consultar ticket por código | Propietario/STAFF/ADMIN | 200 |
| GET | `/api/tickets/by-user?email=...` | Tickets de un usuario | Propietario/ADMIN | 200 |
| PATCH | `/api/tickets/{ticketCode}/cancel` | Cancelar (`PAID → CANCELLED`) | Propietario/ADMIN | 200 |
| PATCH | `/api/tickets/{ticketCode}/use` | Marcar como usado (`PAID → USED`) | STAFF/ADMIN | 200 |

## Códigos HTTP

| Código | Cuándo |
|---|---|
| 200 | Consulta o actualización correcta |
| 201 | Creación de evento, usuario o ticket |
| 400 | Bean Validation fallida, JSON mal formado o parámetro inválido/faltante |
| 401 | Falta identidad o el token es inválido/vencido/manipulado, o el usuario está inactivo |
| 403 | Identidad válida sin rol o sin propiedad sobre el recurso |
| 404 | Recurso inexistente (`ResourceNotFoundException`) o borrador de evento oculto |
| 409 | Duplicado (`DuplicateResourceException`) o regla de negocio incumplida (`BusinessRuleException`) |
| 500 | Error inesperado (sin detalles internos) |

## Formato de errores

Todos los errores usan el mismo contrato, también los `401`/`403` emitidos desde la cadena de filtros:

```json
{
  "timestamp": "2026-10-11T20:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "eventCode": "Event code is required",
    "venueCode": "Venue code is required"
  }
}
```

Nunca se incluye `stacktrace`, hash de contraseña ni datos internos.

## Ejemplos

Registrar un usuario (la contraseña exige entre 12 y 72 caracteres):

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "andrea",
    "email": "andrea@email.com",
    "password": "clave-segura-123",
    "firstName": "Andrea",
    "lastName": "Gomez",
    "phone": "3001234567",
    "city": "Santa Marta",
    "birthDate": "2001-05-20"
  }'
```

Iniciar sesión y guardar el token:

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "identifier": "andrea", "password": "clave-segura-123" }' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
```

Consultar la identidad actual:

```bash
curl http://localhost:8080/api/auth/me -H "Authorization: Bearer $TOKEN"
```

Crear un evento (requiere ADMIN):

```bash
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "eventCode": "CMF-2026",
    "name": "Caribbean Music Fest 2026",
    "description": "Festival de música caribeña",
    "category": "MUSIC",
    "eventDate": "2030-12-01T20:00:00",
    "minimumAge": 18,
    "venueCode": "VEN-SMR-01"
  }'
```

Comprar un ticket (el correo debe ser el del usuario autenticado):

```bash
curl -X POST http://localhost:8080/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "userEmail": "andrea@email.com", "eventCode": "CMF-2026", "type": "VIP" }'
```

Publicar un evento (requiere ADMIN):

```bash
curl -X PATCH http://localhost:8080/api/events/CMF-2026/publish \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Ejecución de pruebas

Los comandos se ejecutan desde la carpeta `demo/`:

```bash
./mvnw clean test
```

| Capa | Tipo de prueba | Requiere Docker |
|---|---|---|
| Repository | Integración con PostgreSQL real (Testcontainers) | Sí |
| Service | Unit tests con Mockito y AssertJ (incluye `AuthServiceImpl`, `AuthorizationServiceImpl`) | No |
| Seguridad (unit) | `JwtServiceTest`, `CustomUserDetailsServiceTest`, `JwtAuthenticationFilterTest` | No |
| Controller | `@WebMvcTest` + MockMvc **con la cadena de seguridad real** y JWT firmados | No |
| Aceptación de seguridad | `SecurityIntegrationTest` (T-SEC-001..020) | No |

Las pruebas de controller ya no desactivan filtros (`addFilters = false` está prohibido por el diseño): cada petición protegida se realiza con un token válido emitido por el `JwtService`, de modo que se ejercita el mismo filtro que en producción.

Para ejecutar solo las pruebas que no requieren Docker:

```bash
./mvnw test -Dtest='!*RepositoryImplTest,!*ImplTest' -DfailIfNoTests=false
```

Para ejecutar solo la suite de seguridad:

```bash
./mvnw test -Dtest='JwtServiceTest,CustomUserDetailsServiceTest,JwtAuthenticationFilterTest,AuthServiceImplTest,AuthorizationServiceImplTest,SecurityIntegrationTest'
```

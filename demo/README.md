# PulsePass

Plataforma de eventos, artistas y entradas. Caso de estudio académico construido por capas:

1. **Persistencia**: entidades JPA, Flyway, PostgreSQL y Testcontainers.
2. **Servicios**: reglas de negocio, DTOs `record`, MapStruct, transacciones y excepciones propias.
3. **Controladores REST**: endpoints HTTP, Bean Validation y manejo global de errores.

## Stack

Java 21 · Spring Boot 4 · Spring MVC · Spring Data JPA / Hibernate · PostgreSQL · Flyway · MapStruct · JUnit 5 · Mockito · AssertJ · MockMvc · Testcontainers

## Arquitectura

```
Cliente HTTP → Controller → Service → Repository → PostgreSQL
                   ↓
          GlobalExceptionHandler → ErrorResponse
```

- El Controller solo traduce HTTP. No contiene reglas de negocio ni accede a repositories.
- Ningún endpoint expone entidades JPA: todo se transporta con DTOs.
- Los errores se centralizan en `GlobalExceptionHandler` (`@RestControllerAdvice`).

## Endpoints

### Venues

| Método | Endpoint | Descripción | Éxito |
|---|---|---|---|
| GET | `/api/venues/{code}` | Consultar venue por código | 200 |
| GET | `/api/venues/active` | Listar venues activos | 200 |

### Eventos

| Método | Endpoint | Descripción | Éxito |
|---|---|---|---|
| POST | `/api/events` | Crear evento (inicia en `DRAFT`) | 201 |
| GET | `/api/events/{eventCode}` | Consultar evento por código | 200 |
| GET | `/api/events/published` | Listar eventos publicados | 200 |
| PATCH | `/api/events/{eventCode}/publish` | Publicar evento (`DRAFT → PUBLISHED`) | 200 |
| POST | `/api/events/{eventCode}/artists/{artistId}` | Asociar artista a un evento | 200 |
| GET | `/api/events/by-artist?stageName=...` | Eventos de un artista | 200 |
| GET | `/api/events/{eventCode}/tickets/paid` | Tickets `PAID` de un evento | 200 |

### Artistas

| Método | Endpoint | Descripción | Éxito |
|---|---|---|---|
| GET | `/api/artists/{id}` | Consultar artista por ID | 200 |
| GET | `/api/artists/by-stage-name?stageName=...` | Consultar por nombre artístico | 200 |
| GET | `/api/artists/active` | Listar artistas activos | 200 |

### Usuarios

| Método | Endpoint | Descripción | Éxito |
|---|---|---|---|
| POST | `/api/users` | Registrar usuario con perfil | 201 |
| GET | `/api/users/by-email?email=...` | Consultar por email | 200 |
| GET | `/api/users/by-username?username=...` | Consultar por username | 200 |

### Tickets

| Método | Endpoint | Descripción | Éxito |
|---|---|---|---|
| POST | `/api/tickets` | Comprar ticket (queda `PAID`) | 201 |
| GET | `/api/tickets/{ticketCode}` | Consultar ticket por código | 200 |
| GET | `/api/tickets/by-user?email=...` | Tickets de un usuario | 200 |
| PATCH | `/api/tickets/{ticketCode}/cancel` | Cancelar (`PAID → CANCELLED`) | 200 |
| PATCH | `/api/tickets/{ticketCode}/use` | Marcar como usado (`PAID → USED`) | 200 |

## Códigos HTTP

| Código | Cuándo |
|---|---|
| 200 | Consulta o actualización correcta |
| 201 | Creación de evento, usuario o ticket |
| 400 | Bean Validation fallida, JSON mal formado o parámetro inválido/faltante |
| 404 | Recurso inexistente (`ResourceNotFoundException`) |
| 409 | Duplicado (`DuplicateResourceException`) o regla de negocio incumplida (`BusinessRuleException`) |
| 500 | Error inesperado (sin detalles internos) |

## Formato de errores

Todos los errores usan el mismo contrato:

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

## Ejemplos

Crear un evento:

```bash
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
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

Comprar un ticket:

```bash
curl -X POST http://localhost:8080/api/tickets \
  -H "Content-Type: application/json" \
  -d '{ "userEmail": "andrea@email.com", "eventCode": "CMF-2026", "type": "VIP" }'
```

## Ejecución de pruebas

Los comandos se ejecutan desde la carpeta `demo/`:

```bash
./mvnw clean test
```

| Capa | Tipo de prueba | Requiere Docker |
|---|---|---|
| Repository | Integración con PostgreSQL real (Testcontainers) | Sí |
| Service | Unit tests con Mockito y AssertJ | No |
| Controller | `@WebMvcTest` + MockMvc con services simulados (`@MockitoBean`) | No |

Para ejecutar solo las pruebas de controller:

```bash
./mvnw test -Dtest='*ControllerTest'
```
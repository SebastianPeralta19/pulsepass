# PulsePass

Aplicación para descubrir eventos y gestionar tickets (Spring Boot 4 + JPA + Flyway + PostgreSQL + MapStruct).

## Modelo

```
Venue 1 ───── N Event
Event N ───── M Artist      (tabla event_artists)
User  1 ───── 1 UserProfile
User  1 ───── N Ticket
Event 1 ───── N Ticket
```

Enums: `EventCategory`, `EventStatus` (DRAFT, PUBLISHED, SOLD_OUT, CANCELLED, FINISHED),
`TicketType` (GENERAL, VIP, BACKSTAGE, STUDENT), `TicketStatus` (RESERVED, PAID, CANCELLED, USED).

## Migraciones

Flyway, en `src/main/resources/db/migration`:

- `V1__create_schema.sql` – esquema completo
- `V2__insert_initial_artists.sql` – artistas iniciales
- `V3__add_streaming_url_to_event.sql` – columna `streaming_url`

## Consultas

Los repositories (`com.pulsepass.repository`) exponen consultas derivadas y `@Query` para
búsquedas por artista, ciudad, estado, conteo de tickets pagados, etc.

## Capa de servicios

```
Controller (futuro) → Service (interfaz) → ServiceImpl → Repository → Entity
                                              ├── Mapper (MapStruct) → DTO (record)
                                              └── Reglas de negocio + @Transactional
```

| Paquete | Contenido |
|---|---|
| `service` / `service.impl` | `VenueService`, `ArtistService`, `EventService`, `UserService`, `TicketService` y sus implementaciones |
| `dto.request` / `dto.response` | DTOs inmutables (`record`); nunca se exponen entidades JPA |
| `mapper` | Mappers MapStruct Entity → DTO |
| `exception` | `ResourceNotFoundException`, `DuplicateResourceException`, `BusinessRuleException` |
| `config` | `ClockConfig` (el `Clock` se inyecta para poder fijar la fecha en los tests) |

Decisiones de diseño:

- **Precio**: lo calcula el sistema (`TicketPricingStrategy`), el cliente nunca lo envía.
  `GENERAL` = precio base, `STUDENT` = x0.70, `VIP` = x2.50, `BACKSTAGE` = x4.00.
  El precio base se configura con `pulsepass.pricing.base-price` (por defecto `100.00`).
- **Email**: se guarda en minúsculas y la unicidad se valida ignorando mayúsculas.
- **Edad mínima**: se evalúa en la fecha del evento, no en la fecha de compra.
- **Compra**: es atómica (`@Transactional`); si completa el aforo, el evento pasa a `SOLD_OUT`
  en la misma transacción.
- **Concurrencia**: fuera de alcance (ver sección 53 del PRD); dos compras simultáneas podrían
  ver el mismo cupo.

## Ejecución de pruebas

```bash
# Unit tests de Service (JUnit 5 + Mockito + AssertJ). No necesitan Docker ni PostgreSQL
./mvnw test -Dtest='*ServiceImplTest,DefaultTicketPricingStrategyTest'

# Toda la suite (los tests de repository usan Testcontainers y requieren Docker encendido)
./mvnw clean test
```

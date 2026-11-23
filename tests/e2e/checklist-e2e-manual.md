# Checklist E2E manual

Marca cada caso solo después de observar la respuesta real. Un código correcto
con un cuerpo incorrecto no es PASS.

Convenciones de actores:

- `ANÓNIMO`: sin `Authorization`.
- `USER_A`: token de `e2e_user_a`.
- `USER_B`: token de `e2e_user_b`.
- `STAFF`: token de `e2e_staff`.
- `ADMIN`: token de `e2e_admin`.

## Orden inicial recomendado

En `02 Artists`, ejecuta primero `TC-ART-03`, copia el `id` de `Solar Beat` en
`artistId` y después ejecuta `TC-ART-01` y `TC-ART-02`.

En `03 Auth / usuarios`, registra USER_A y USER_B antes de intentar sus login.

En `04 Usuarios / consulta y propiedad`, `TC-USR-03-nominal` requiere
`userBToken`; `TC-SEC-007` usa `userAToken` y debe devolver 403 porque el usuario
existe pero es ajeno.

En `06 Tickets`, ejecuta `TC-TKT-03-nominal` después de `TC-BIZ-007` para que
USER_A ya tenga al menos un ticket.

## 00 Preparación / conectividad

| Hecho | ID | Método | Ruta | Actor | Esperado |
|---|---|---|---|---|---|
| [ ] | PRE-01 | GET | `/api/venues/active` | ANÓNIMO | 200 con arreglo JSON |

## 01 Venues

| Hecho | ID | Método | Ruta | Actor | Esperado |
|---|---|---|---|---|---|
| [ ] | TC-VEN-01 | GET | `/api/venues/{{venueActiveCode}}` | ANÓNIMO | 200, venue activo |
| [ ] | TC-BIZ-001 | GET | `/api/venues/active` | ANÓNIMO | 200, incluye el venue del seed |

## 02 Artists

| Hecho | ID | Método | Ruta | Actor | Esperado |
|---|---|---|---|---|---|
| [ ] | TC-ART-03 | GET | `/api/artists/active` | ANÓNIMO | 200, incluye Solar Beat |
| [ ] | TC-ART-01 | GET | `/api/artists/{{artistId}}` | ANÓNIMO | 200, artista correcto |
| [ ] | TC-ART-02 | GET | `/api/artists/by-stage-name?stageName={{artistStageName}}` | ANÓNIMO | 200, búsqueda case-sensitive |

## 03 Auth / usuarios

| Hecho | ID | Método | Ruta | Actor | Esperado |
|---|---|---|---|---|---|
| [ ] | TC-AUTH-001A | POST | `/api/users` | ANÓNIMO | 201, sin credenciales en la respuesta |
| [ ] | TC-AUTH-001B | POST | `/api/users` | ANÓNIMO | 201, USER_B con birthDate 2018 |
| [ ] | TC-BIZ-006 | POST | `/api/users` | ANÓNIMO | 409, no duplica USER_A |
| [ ] | TC-AUTH-002 | POST | `/api/auth/login` | ANÓNIMO | 200, copiar token a `userAToken` |
| [ ] | TC-AUTH-002-B | POST | `/api/auth/login` | ANÓNIMO | 200, copiar token a `userBToken` |
| [ ] | TC-AUTH-002-STAFF | POST | `/api/auth/login` | ANÓNIMO | 200, copiar token a `staffToken` |
| [ ] | TC-AUTH-002-ADMIN | POST | `/api/auth/login` | ANÓNIMO | 200, copiar token a `adminToken` |
| [ ] | TC-AUTH-004 | POST | `/api/auth/login` | ANÓNIMO | 401 genérico |
| [ ] | TC-AUTH-006 | GET | `/api/auth/me` | USER_A | 200, rol USER |
| [ ] | TC-AUTH-007 | GET | `/api/auth/me` | ANÓNIMO | 401 |
| [ ] | TC-AUTH-008 | GET | `/api/auth/me` | ANÓNIMO | 401, Authorization sin esquema Bearer |
| [ ] | TC-AUTH-009 | GET | `/api/auth/me` | USER_A | 401, token alterado |
| [ ] | TC-AUTH-010 | GET | `/api/auth/me` | USER_A | 401, JWT expirado; preparación externa |
| [ ] | TC-AUTH-011 | GET | `/api/auth/me` | USER_B | 401, otra clave o issuer; preparación externa |
| [ ] | TC-AUTH-012 | GET | `/api/auth/me?access_token={{userAToken}}` | ANÓNIMO | 401, token por query no autentica |
| [ ] | TC-AUTH-013 | GET | `/api/auth/me` | USER_B | 401, usuario inactivo; preparación externa |
| [ ] | TC-AUTH-014 | POST | `/api/events` | USER_A | 403, no persiste evento |
| [ ] | TC-AUTH-015 | GET | `/api/venues/active` | ANÓNIMO | 401 por Bearer inválido |

## 04 Usuarios / consulta y propiedad

| Hecho | ID | Método | Ruta | Actor | Esperado |
|---|---|---|---|---|---|
| [ ] | TC-USR-02 | GET | `/api/users/by-email?email={{userAEmail}}` | USER_A | 200, datos propios |
| [ ] | TC-SEC-006-ADMIN | GET | `/api/users/by-email?email={{userAEmail}}` | ADMIN | 200 |
| [ ] | TC-USR-03-nominal | GET | `/api/users/by-username?username={{userBUsername}}` | USER_B | 200, usuario propio |
| [ ] | TC-SEC-007 | GET | `/api/users/by-username?username={{userBUsername}}` | USER_A | 403, usuario ajeno |
| [ ] | TC-AUTH-007-USR-UN | GET | `/api/users/by-username?username={{userBUsername}}` | ANÓNIMO | 401 |

## 05 Events / administración y visibilidad

| Hecho | ID | Método | Ruta | Actor | Esperado |
|---|---|---|---|---|---|
| [ ] | TC-BIZ-003 | POST | `/api/events` | ADMIN | 201, evento DRAFT |
| [ ] | TC-BIZ-003-R | GET | `/api/events/{{newEventCode}}` | ADMIN | 200, DRAFT |
| [ ] | TC-EVT-02-DRAFT | GET | `/api/events/{{draftEventCode}}` | ANÓNIMO | 404 |
| [ ] | TC-BIZ-005 | POST | `/api/events/{{eventToPublishCode}}/artists/{{artistId}}` | ADMIN | 200, artista asociado |
| [ ] | TC-BIZ-004 | PATCH | `/api/events/{{eventToPublishCode}}/publish` | ADMIN | 200, PUBLISHED |
| [ ] | TC-BIZ-004-R | GET | `/api/events/{{eventToPublishCode}}` | ANÓNIMO | 200, PUBLISHED |
| [ ] | TC-BIZ-004-L | GET | `/api/events/published` | ANÓNIMO | 200, incluye el evento publicado |
| [ ] | TC-BIZ-005-R | GET | `/api/events/by-artist?stageName={{artistStageName}}` | ANÓNIMO | 200, excluye borradores |
| [ ] | TC-BIZ-003-DUP | POST | `/api/events` | ADMIN | 409, código duplicado |
| [ ] | TC-BIZ-003-PAST | POST | `/api/events` | ADMIN | 409, fecha pasada |

## 06 Tickets / compra, consulta y ciclo de vida

| Hecho | ID | Método | Ruta | Actor | Esperado |
|---|---|---|---|---|---|
| [ ] | TC-BIZ-007 | POST | `/api/tickets` | USER_A | 201, copiar a `ticketCancelableCode` |
| [ ] | TC-BIZ-008 | GET | `/api/tickets/{{ticketCancelableCode}}` | USER_A | 200, PAID |
| [ ] | TC-BIZ-008-L | GET | `/api/tickets/by-user?email={{userAEmail}}` | USER_A | 200, listado propio |
| [ ] | TC-BIZ-009 | GET | `/api/events/{{publishedEventCode}}/tickets/paid` | STAFF | 200, solo PAID |
| [ ] | TC-TKT-03-nominal | GET | `/api/tickets/by-user?email={{userAEmail}}` | USER_A | 200, solo tickets propios |
| [ ] | TC-SEC-010 | GET | `/api/tickets/by-user?email={{userAEmail}}` | USER_B | 403, tickets ajenos |
| [ ] | TC-AUTH-007-TKT-USER | GET | `/api/tickets/by-user?email={{userAEmail}}` | ANÓNIMO | 401 |
| [ ] | TC-BIZ-010 | PATCH | `/api/tickets/{{ticketCancelableCode}}/cancel` | USER_A | 200, CANCELLED |
| [ ] | TC-BIZ-010-R | GET | `/api/tickets/{{ticketCancelableCode}}` | USER_A | 200, CANCELLED |
| [ ] | TC-BIZ-011 | PATCH | `/api/tickets/{{ticketCancelableCode}}/cancel` | USER_A | 409 |
| [ ] | TC-BIZ-012 | POST | `/api/tickets` | USER_A | 201, copiar a `ticketUsableCode` |
| [ ] | TC-BIZ-012-U | PATCH | `/api/tickets/{{ticketUsableCode}}/use` | STAFF | 200, USED |
| [ ] | TC-BIZ-012-R | GET | `/api/tickets/{{ticketUsableCode}}` | USER_A | 200, USED sin mutación |
| [ ] | TC-BIZ-013 | PATCH | `/api/tickets/{{ticketUsableCode}}/use` | STAFF | 409 |
| [ ] | TC-BIZ-014-NP | POST | `/api/tickets` | USER_A | 409, evento no publicado |
| [ ] | TC-BIZ-014-AGE | POST | `/api/tickets` | USER_B | 409, edad mínima |
| [ ] | TC-BIZ-014-CAP-1 | POST | `/api/tickets` | USER_A | 201, cupo 1 de 3 |
| [ ] | TC-BIZ-014-CAP-2 | POST | `/api/tickets` | USER_A | 201, cupo 2 de 3 |
| [ ] | TC-BIZ-014-CAP-3 | POST | `/api/tickets` | USER_A | 201, cupo 3 de 3 y SOLD_OUT |
| [ ] | TC-BIZ-014-CAP-4 | POST | `/api/tickets` | USER_A | 409, sin aforo |
| [ ] | TC-BIZ-015-EVT | POST | `/api/tickets` | USER_A | 404, evento inexistente |
| [ ] | TC-BIZ-015-TKT | GET | `/api/tickets/{{runId}}-TICKET-NO-EXISTE` | USER_A | 404, ticket inexistente |

## 07 Seguridad / escenarios negativos

| Hecho | ID | Método | Ruta | Actor | Esperado |
|---|---|---|---|---|---|
| [ ] | TC-SEC-001A | POST | `/api/events` | ANÓNIMO | 401 |
| [ ] | TC-SEC-001B | POST | `/api/events` | USER_A | 403 |
| [ ] | TC-SEC-002A | PATCH | `/api/events/{{draftEventCode}}/publish` | USER_A | 403 |
| [ ] | TC-SEC-002B | PATCH | `/api/events/{{draftEventCode}}/publish` | STAFF | 403 |
| [ ] | TC-SEC-003 | POST | `/api/events/{{draftEventCode}}/artists/{{artistId}}` | USER_A | 403 |
| [ ] | TC-SEC-004 | GET | `/api/events/{{draftEventCode}}` | ANÓNIMO | 404 |
| [ ] | TC-SEC-005 | GET | `/api/events/by-artist?stageName={{artistStageName}}` | ANÓNIMO | 200, sin borradores |
| [ ] | TC-SEC-006 | GET | `/api/users/by-email?email={{userAEmail}}` | USER_B | 403 |
| [ ] | TC-SEC-008 | POST | `/api/tickets` | USER_A | 403, compra a nombre de USER_B |
| [ ] | TC-SEC-009 | GET | `/api/tickets/{{ticketCancelableCode}}` | USER_B | 403 |
| [ ] | TC-SEC-009-R | GET | `/api/tickets/{{ticketCancelableCode}}` | USER_A | 200, sin mutación |
| [ ] | TC-SEC-011 | PATCH | `/api/tickets/{{ticketCancelableCode}}/cancel` | USER_B | 403 |
| [ ] | TC-SEC-011-R | GET | `/api/tickets/{{ticketCancelableCode}}` | USER_A | 200, sin mutación |
| [ ] | TC-SEC-012 | PATCH | `/api/tickets/{{ticketCancelableCode}}/use` | USER_B | 403 |
| [ ] | TC-SEC-012-R | GET | `/api/tickets/{{ticketCancelableCode}}` | USER_A | 200, sin mutación |
| [ ] | TC-SEC-013 | GET | `/api/events/{{publishedEventCode}}/tickets/paid` | USER_A | 403 |
| [ ] | TC-SEC-014 | PATCH | `/api/tickets/{{staffUseTicketCode}}/use` | STAFF | 200, ticket del seed pasa a USED |
| [ ] | TC-SEC-015 | GET | `/api/events/{{draftEventCode}}` | ADMIN | 200, DRAFT |
| [ ] | TC-SEC-016 | POST | `/api/users` | ANÓNIMO | 201, rol inyectado ignorado |
| [ ] | TC-SEC-016-R | POST | `/api/auth/login` | ANÓNIMO | 200, copiar token temporal |
| [ ] | TC-SEC-016-A | POST | `/api/events` | USER_B | 403, con token temporal; restaurar después |
| [ ] | TC-SEC-017 | GET | `/api/events/{{publishedEventCode}}/tickets/paid` | STAFF | 403, rol revocado; preparación externa |
| [ ] | TC-SEC-017-R | GET | `/api/events/{{publishedEventCode}}/tickets/paid` | ADMIN | 200, sin mutación |

## 08 Validaciones y errores HTTP

| Hecho | ID | Método | Ruta | Actor | Esperado |
|---|---|---|---|---|---|
| [ ] | TC-HTTP-400-REG-EMAIL | POST | `/api/users` | ANÓNIMO | 400, email inválido |
| [ ] | TC-HTTP-400-REG-PASS | POST | `/api/users` | ANÓNIMO | 400, password corta |
| [ ] | TC-HTTP-400-EVT-CAT | POST | `/api/events` | ADMIN | 400, enum inválido |
| [ ] | TC-HTTP-400-PARAM | GET | `/api/artists/by-stage-name` | ANÓNIMO | 400, falta stageName |
| [ ] | TC-HTTP-404-EVENT | GET | `/api/events/{{runId}}-EVENT-NO-EXISTE` | ANÓNIMO | 404 |
| [ ] | TC-HTTP-405-METHOD | DELETE | `/api/venues/active` | USER_A | 405 |

## 09 Flujos de negocio / secuencia recomendada

| Hecho | ID | Método | Ruta | Actor | Esperado |
|---|---|---|---|---|---|
| [ ] | FLOW-A-01 | GET | `/api/venues/active` | ANÓNIMO | 200 |
| [ ] | FLOW-A-02 | GET | `/api/events/published` | ANÓNIMO | 200 |
| [ ] | FLOW-A-03 | GET | `/api/events/{{draftEventCode}}` | ANÓNIMO | 404 |
| [ ] | FLOW-B-01 | POST | `/api/users` | ANÓNIMO | 201 en base limpia; 409 si USER_A ya existe |
| [ ] | FLOW-C-01 | POST | `/api/events` | ADMIN | 201 en base limpia; 409 si `newEventCode` ya existe |
| [ ] | FLOW-C-02 | POST | `/api/events/{{newEventCode}}/artists/{{artistId}}` | ADMIN | 200 |
| [ ] | FLOW-C-03 | PATCH | `/api/events/{{newEventCode}}/publish` | ADMIN | 200 |
| [ ] | FLOW-D-01 | POST | `/api/tickets` | USER_A | 201 y copiar `ticketCancelableCode` |
| [ ] | FLOW-E-01 | GET | `/api/auth/me` | ANÓNIMO | 401 |

## Cierre

- Total de casos: 99.
- Si un caso queda bloqueado por un dato previo, regístralo como `BLOCKED`, no
  como `FAIL`.
- Si un caso falla, conserva la respuesta y el request exactos en el registro.
- No marques la corrida completa como PASS si queda algún caso `FAIL`, `BLOCKED`
  o `NOT RUN`.

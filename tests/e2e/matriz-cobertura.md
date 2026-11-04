# Matriz de cobertura E2E

La colección actual contiene **91 requests**. Cubre **22 de las 22 rutas
lógicas** de la API y las reglas críticas de autenticación, autorización,
visibilidad, publicación, compra, cancelación, uso y aforo.

No es el plan completo de 148 casos. Las brechas de reglas se listan al final y
no deben confundirse con PASS.

## Cobertura por ruta

| # | Método | Ruta | Casos en la colección | Estado |
|---|---|---|---|---|
| 1 | POST | `/api/auth/login` | TC-AUTH-002, TC-AUTH-002-B, TC-AUTH-002-STAFF, TC-AUTH-002-ADMIN, TC-AUTH-004, TC-SEC-016-R | Cubierta |
| 2 | GET | `/api/auth/me` | TC-AUTH-006, TC-AUTH-007, TC-AUTH-009, TC-AUTH-010, TC-AUTH-011, TC-AUTH-012, TC-AUTH-013, FLOW-E-01 | Cubierta |
| 3 | GET | `/api/venues/{code}` | TC-VEN-01 | Cubierta |
| 4 | GET | `/api/venues/active` | PRE-01, TC-BIZ-001, TC-AUTH-015, FLOW-A-01 | Cubierta |
| 5 | POST | `/api/events` | TC-AUTH-014, TC-BIZ-003, TC-BIZ-003-DUP, TC-BIZ-003-PAST, TC-SEC-001A, TC-SEC-001B, TC-SEC-016-A, TC-HTTP-400-EVT-CAT, FLOW-C-01 | Cubierta |
| 6 | GET | `/api/events/{eventCode}` | TC-BIZ-003-R, TC-EVT-02-DRAFT, TC-BIZ-004-R, TC-SEC-004, TC-SEC-015, TC-HTTP-404-EVENT, FLOW-A-03 | Cubierta |
| 7 | GET | `/api/events/published` | TC-BIZ-004-L, FLOW-A-02 | Cubierta |
| 8 | PATCH | `/api/events/{eventCode}/publish` | TC-BIZ-004, TC-SEC-002A, TC-SEC-002B, FLOW-C-03 | Cubierta |
| 9 | POST | `/api/events/{eventCode}/artists/{artistId}` | TC-BIZ-005, TC-SEC-003, FLOW-C-02 | Cubierta |
| 10 | GET | `/api/events/by-artist` | TC-BIZ-005-R, TC-SEC-005 | Cubierta |
| 11 | GET | `/api/events/{eventCode}/tickets/paid` | TC-BIZ-009, TC-SEC-013, TC-SEC-017 | Cubierta |
| 12 | GET | `/api/artists/{id}` | TC-ART-01 | Cubierta |
| 13 | GET | `/api/artists/by-stage-name` | TC-ART-02, TC-HTTP-400-PARAM | Cubierta |
| 14 | GET | `/api/artists/active` | TC-ART-03 | Cubierta |
| 15 | POST | `/api/users` | TC-AUTH-001A, TC-AUTH-001B, TC-BIZ-006, TC-SEC-016, TC-HTTP-400-REG-EMAIL, TC-HTTP-400-REG-PASS, FLOW-B-01 | Cubierta |
| 16 | GET | `/api/users/by-email` | TC-USR-02, TC-SEC-006-ADMIN, TC-SEC-006 | Cubierta |
| 17 | GET | `/api/users/by-username` | TC-USR-03-nominal, TC-SEC-007, TC-AUTH-007-USR-UN | Cubierta |
| 18 | POST | `/api/tickets` | TC-BIZ-007, TC-BIZ-012, TC-BIZ-014-NP, TC-BIZ-014-AGE, TC-BIZ-014-CAP-1, TC-BIZ-014-CAP-2, TC-BIZ-014-CAP-3, TC-BIZ-014-CAP-4, TC-BIZ-015-EVT, TC-SEC-008, FLOW-D-01 | Cubierta |
| 19 | GET | `/api/tickets/{ticketCode}` | TC-BIZ-008, TC-BIZ-010-R, TC-SEC-009 | Cubierta |
| 20 | GET | `/api/tickets/by-user` | TC-TKT-03-nominal, TC-SEC-010, TC-AUTH-007-TKT-USER | Cubierta |
| 21 | PATCH | `/api/tickets/{ticketCode}/cancel` | TC-BIZ-010, TC-BIZ-011, TC-SEC-011 | Cubierta |
| 22 | PATCH | `/api/tickets/{ticketCode}/use` | TC-BIZ-012-U, TC-BIZ-013, TC-SEC-012, TC-SEC-014 | Cubierta |

## Cobertura por regla

| Regla | Casos | Estado |
|---|---|---|
| Registro crea USER y no expone credenciales | TC-AUTH-001A, TC-AUTH-001B | Cubierta |
| Username o email duplicado | TC-BIZ-006 | Cubierta |
| Login por username o email | TC-AUTH-002, TC-AUTH-002-B | Cubierta |
| Password incorrecta devuelve 401 genérico | TC-AUTH-004 | Cubierta |
| Ruta protegida sin token | TC-AUTH-007, TC-AUTH-007-USR-UN, TC-AUTH-007-TKT-USER, TC-SEC-001A | Cubierta |
| JWT alterado | TC-AUTH-009 | Cubierta |
| JWT expirado | TC-AUTH-010 | Externa |
| JWT con otra clave o issuer | TC-AUTH-011 | Externa |
| Token por query string no autentica | TC-AUTH-012 | Cubierta |
| Usuario inactivo con token previo | TC-AUTH-013 | Externa |
| Bearer inválido en ruta pública | TC-AUTH-015 | Cubierta |
| Rol insuficiente | TC-AUTH-014, TC-SEC-001B, TC-SEC-002A, TC-SEC-002B, TC-SEC-013 | Cubierta |
| Borrador oculto al público | TC-EVT-02-DRAFT, TC-SEC-004, FLOW-A-03 | Cubierta |
| STAFF/ADMIN ven borradores | TC-SEC-015 | Cubierta |
| Publicación y visibilidad | TC-BIZ-004, TC-BIZ-004-R, TC-BIZ-004-L | Cubierta |
| Asociación de artista | TC-BIZ-005, TC-BIZ-005-R | Cubierta |
| Búsqueda por artista excluye borradores | TC-BIZ-005-R, TC-SEC-005 | Cubierta |
| Duplicado de evento | TC-BIZ-003-DUP | Cubierta |
| Fecha pasada al crear evento | TC-BIZ-003-PAST | Cubierta |
| Propiedad de usuario | TC-USR-02, TC-USR-03-nominal, TC-SEC-006, TC-SEC-006-ADMIN, TC-SEC-007 | Cubierta |
| Listado de tickets por usuario | TC-TKT-03-nominal, TC-SEC-010 | Cubierta |
| Compra para sí mismo | TC-BIZ-007, TC-BIZ-012, FLOW-D-01 | Cubierta |
| Compra a nombre de otro | TC-SEC-008 | Cubierta |
| Evento no publicado | TC-BIZ-014-NP | Cubierta |
| Evento inexistente al comprar | TC-BIZ-015-EVT | Cubierta |
| Edad mínima | TC-BIZ-014-AGE | Cubierta |
| Aforo y SOLD_OUT | TC-BIZ-014-CAP-1, TC-BIZ-014-CAP-2, TC-BIZ-014-CAP-3, TC-BIZ-014-CAP-4 | Cubierta |
| Cancelación de ticket | TC-BIZ-010, TC-BIZ-010-R | Cubierta |
| Doble cancelación | TC-BIZ-011 | Cubierta |
| Uso de ticket | TC-BIZ-012-U | Cubierta |
| Doble uso | TC-BIZ-013 | Cubierta |
| Propiedad al leer ticket | TC-SEC-009 | Cubierta |
| Propiedad al cancelar ticket | TC-SEC-011 | Cubierta |
| Propiedad y rol al usar ticket | TC-SEC-012 | Cubierta |
| STAFF usa ticket elegible | TC-SEC-014 | Cubierta |
| Rol revocado por base de datos | TC-SEC-017 | Externa |
| Rol inyectado en registro | TC-SEC-016, TC-SEC-016-R, TC-SEC-016-A | Cubierta |
| Validación de email | TC-HTTP-400-REG-EMAIL | Cubierta |
| Validación de password | TC-HTTP-400-REG-PASS | Cubierta |
| Enum inválido | TC-HTTP-400-EVT-CAT | Cubierta |
| Parámetro faltante | TC-HTTP-400-PARAM | Cubierta |
| Recurso inexistente | TC-HTTP-404-EVENT | Cubierta |
| Método no soportado | TC-HTTP-405-METHOD | Cubierta |

## Casos externos

| Caso | Preparación |
|---|---|
| TC-AUTH-010 | Token expirado; ver `fixtures/README.md`. |
| TC-AUTH-011 | Token firmado con otra clave o issuer; ver `fixtures/README.md`. |
| TC-AUTH-013 | Desactivar USER_B después de obtener su token; ver `fixtures/README.md`. |
| TC-SEC-017 | Retirar ROLE_STAFF después de obtener el token; ver `fixtures/README.md`. |

## Brechas conocidas

### Rutas sin caso

Ninguna: las 22 rutas lógicas tienen al menos un caso en la colección.

### Casos del plan previo que no están en esta colección

- TC-AUTH-008
- TC-BIZ-008-L
- TC-BIZ-012-R
- TC-BIZ-015-TKT
- TC-SEC-009-R
- TC-SEC-011-R
- TC-SEC-012-R
- TC-SEC-017-R

### Reglas sin caso dedicado

- Artista duplicado en el mismo evento.
- Publicar un evento que no está en DRAFT.
- Agregar artista a un evento CANCELLED o FINISHED.
- Cancelar un ticket USED.
- Cancelar un ticket después de la fecha del evento.
- Listar tickets PAID de un evento inexistente, que debe devolver 200 con `[]`.
- Consultar un ticket inexistente.
- Validación de JSON mal formado fuera del enum de categoría.
- Tipo de dato inválido en un path variable.

Estas brechas deben registrarse como pendientes. No deben presentarse como
cobertura completa del PRD.

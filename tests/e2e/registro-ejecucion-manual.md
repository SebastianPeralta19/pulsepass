# Registro de ejecución manual

Copia este archivo o usa una sección nueva por corrida. No borres los resultados
anteriores. Adjunta capturas o cuerpos de respuesta sin tokens, contraseñas ni
datos personales reales.

## Metadatos de la corrida

| Campo | Valor |
|---|---|
| Corrida | RUN01 |
| Fecha y hora | NOT RUN |
| Ejecutor | NOT RUN |
| Rama | `layer-e2e` |
| Commit | No aplica; no se creó commit |
| Base de datos | `pulsepass_e2e` |
| URL base | `http://localhost:8080` |
| Postman | NOT RUN |
| JVM | Java 21 |
| Observaciones | Colección escrita con 99 requests; aún no ejecutada |

## Resumen

| Resultado | Cantidad |
|---|---|
| PASS | 0 |
| FAIL | 0 |
| BLOCKED | 0 |
| NOT RUN | 99 |
| Total | 99 |

## Defectos y observaciones conocidos

Estos hallazgos se registran para una futura corrección. Por decisión de alcance
no se modifica código en esta entrega.

1. **Token de usuario inactivo en ruta pública.** `JwtAuthenticationFilter.java:91`
   continúa la cadena sin autenticar cuando el usuario no está activo. En rutas
   protegidas el resultado es `401`, pero en rutas públicas puede devolver `200`.
   TC-AUTH-013 solo cubre `/api/auth/me`.
2. **Estados distintos de PUBLISHED ocultos al público.** `EventServiceImpl.java:90`
   y `EventServiceImpl.java:156-160` ocultan cualquier estado distinto de
   `PUBLISHED` para no privilegiados, no solo los borradores. `SOLD_OUT`,
   `CANCELLED` y `FINISHED` también devuelven `404` o se omiten.
3. **El aforo no se libera al cancelar.** `TicketServiceImpl.java:94` cuenta solo
   tickets `PAID`; al llenar el aforo el evento pasa a `SOLD_OUT`
   (`TicketServiceImpl.java:116-117`) y `cancel()` no revierte ese estado. Una
   cancelación no reabre la compra.
4. **Password de más de 72 bytes devuelve 409.** `AuthServiceImpl.java:135-142`
   valida el máximo en bytes y lanza `BusinessRuleException`;
   `GlobalExceptionHandler.java:38-40` la traduce a `409`. Para ASCII de más de
   72 caracteres Bean Validation devuelve `400`; para multibyte de hasta 72
   caracteres el resultado cambia a `409`.
5. **Username sensible a mayúsculas en el registro vs login case-insensitive.**
   `UserServiceImpl.java:50` valida duplicados con `existsByUsername` exacto,
   mientras `UserRepository.java:28-30` autentica con `LOWER(username)`.
   Podrían coexistir `Ana` y `ana`, y el login podría encontrar más de una fila.

### Casos del PRD sin request en la colección

Ninguno: los 8 casos del plan previo ya tienen request en la colección. No se
presentan como cobertura completa del PRD.

## 00 Preparación / conectividad

| ID | Resultado | HTTP observado | Evidencia | Notas |
|---|---|---|---|---|
| PRE-01 | NOT RUN | | | |

## 01 Venues

| ID | Resultado | HTTP observado | Evidencia | Notas |
|---|---|---|---|---|
| TC-VEN-01 | NOT RUN | | | |
| TC-BIZ-001 | NOT RUN | | | |

## 02 Artists

| ID | Resultado | HTTP observado | Evidencia | Notas |
|---|---|---|---|---|
| TC-ART-03 | NOT RUN | | | Ejecutar antes de ART-01 |
| TC-ART-01 | NOT RUN | | | |
| TC-ART-02 | NOT RUN | | | |

## 03 Auth / usuarios

| ID | Resultado | HTTP observado | Evidencia | Notas |
|---|---|---|---|---|
| TC-AUTH-001A | NOT RUN | | | |
| TC-AUTH-001B | NOT RUN | | | |
| TC-BIZ-006 | NOT RUN | | | |
| TC-AUTH-002 | NOT RUN | | | |
| TC-AUTH-002-B | NOT RUN | | | |
| TC-AUTH-002-STAFF | NOT RUN | | | |
| TC-AUTH-002-ADMIN | NOT RUN | | | |
| TC-AUTH-004 | NOT RUN | | | |
| TC-AUTH-006 | NOT RUN | | | |
| TC-AUTH-007 | NOT RUN | | | |
| TC-AUTH-008 | NOT RUN | | | Esperado 401; Authorization sin Bearer |
| TC-AUTH-009 | NOT RUN | | | |
| TC-AUTH-010 | NOT RUN | | | Preparación externa |
| TC-AUTH-011 | NOT RUN | | | Preparación externa |
| TC-AUTH-012 | NOT RUN | | | |
| TC-AUTH-013 | NOT RUN | | | Preparación externa |
| TC-AUTH-014 | NOT RUN | | | |
| TC-AUTH-015 | NOT RUN | | | |

## 04 Usuarios / consulta y propiedad

| ID | Resultado | HTTP observado | Evidencia | Notas |
|---|---|---|---|---|
| TC-USR-02 | NOT RUN | | | |
| TC-SEC-006-ADMIN | NOT RUN | | | |
| TC-USR-03-nominal | NOT RUN | | | Esperado 200; usuario propio |
| TC-SEC-007 | NOT RUN | | | Esperado 403; usuario ajeno |
| TC-AUTH-007-USR-UN | NOT RUN | | | Esperado 401; sin token |

## 05 Events / administración y visibilidad

| ID | Resultado | HTTP observado | Evidencia | Notas |
|---|---|---|---|---|
| TC-BIZ-003 | NOT RUN | | | |
| TC-BIZ-003-R | NOT RUN | | | |
| TC-EVT-02-DRAFT | NOT RUN | | | |
| TC-BIZ-005 | NOT RUN | | | |
| TC-BIZ-004 | NOT RUN | | | |
| TC-BIZ-004-R | NOT RUN | | | |
| TC-BIZ-004-L | NOT RUN | | | |
| TC-BIZ-005-R | NOT RUN | | | |
| TC-BIZ-003-DUP | NOT RUN | | | |
| TC-BIZ-003-PAST | NOT RUN | | | |

## 06 Tickets / compra, consulta y ciclo de vida

| ID | Resultado | HTTP observado | Evidencia | Notas |
|---|---|---|---|---|
| TC-BIZ-007 | NOT RUN | | | |
| TC-BIZ-008 | NOT RUN | | | |
| TC-BIZ-008-L | NOT RUN | | | Esperado 200; listado propio |
| TC-BIZ-009 | NOT RUN | | | |
| TC-TKT-03-nominal | NOT RUN | | | Esperado 200; ejecutar tras TC-BIZ-007 |
| TC-SEC-010 | NOT RUN | | | Esperado 403; tickets ajenos |
| TC-AUTH-007-TKT-USER | NOT RUN | | | Esperado 401; sin token |
| TC-BIZ-010 | NOT RUN | | | |
| TC-BIZ-010-R | NOT RUN | | | |
| TC-BIZ-011 | NOT RUN | | | |
| TC-BIZ-012 | NOT RUN | | | |
| TC-BIZ-012-U | NOT RUN | | | |
| TC-BIZ-012-R | NOT RUN | | | Esperado 200; USED sin mutación |
| TC-BIZ-013 | NOT RUN | | | |
| TC-BIZ-014-NP | NOT RUN | | | |
| TC-BIZ-014-AGE | NOT RUN | | | |
| TC-BIZ-014-CAP-1 | NOT RUN | | | |
| TC-BIZ-014-CAP-2 | NOT RUN | | | |
| TC-BIZ-014-CAP-3 | NOT RUN | | | |
| TC-BIZ-014-CAP-4 | NOT RUN | | | |
| TC-BIZ-015-EVT | NOT RUN | | | |
| TC-BIZ-015-TKT | NOT RUN | | | Esperado 404; ticket inexistente |

## 07 Seguridad / escenarios negativos

| ID | Resultado | HTTP observado | Evidencia | Notas |
|---|---|---|---|---|
| TC-SEC-001A | NOT RUN | | | |
| TC-SEC-001B | NOT RUN | | | |
| TC-SEC-002A | NOT RUN | | | |
| TC-SEC-002B | NOT RUN | | | |
| TC-SEC-003 | NOT RUN | | | |
| TC-SEC-004 | NOT RUN | | | |
| TC-SEC-005 | NOT RUN | | | |
| TC-SEC-006 | NOT RUN | | | |
| TC-SEC-008 | NOT RUN | | | |
| TC-SEC-009 | NOT RUN | | | |
| TC-SEC-009-R | NOT RUN | | | Esperado 200; sin mutación |
| TC-SEC-011 | NOT RUN | | | |
| TC-SEC-011-R | NOT RUN | | | Esperado 200; sin mutación |
| TC-SEC-012 | NOT RUN | | | |
| TC-SEC-012-R | NOT RUN | | | Esperado 200; sin mutación |
| TC-SEC-013 | NOT RUN | | | |
| TC-SEC-014 | NOT RUN | | | Consume el ticket del seed |
| TC-SEC-015 | NOT RUN | | | |
| TC-SEC-016 | NOT RUN | | | |
| TC-SEC-016-R | NOT RUN | | | Token temporal |
| TC-SEC-016-A | NOT RUN | | | Restaurar `userBToken` |
| TC-SEC-017 | NOT RUN | | | Preparación externa |
| TC-SEC-017-R | NOT RUN | | | Esperado 200; ADMIN relee |

## 08 Validaciones y errores HTTP

| ID | Resultado | HTTP observado | Evidencia | Notas |
|---|---|---|---|---|
| TC-HTTP-400-REG-EMAIL | NOT RUN | | | |
| TC-HTTP-400-REG-PASS | NOT RUN | | | |
| TC-HTTP-400-EVT-CAT | NOT RUN | | | |
| TC-HTTP-400-PARAM | NOT RUN | | | |
| TC-HTTP-404-EVENT | NOT RUN | | | |
| TC-HTTP-405-METHOD | NOT RUN | | | |

## 09 Flujos de negocio / secuencia recomendada

| ID | Resultado | HTTP observado | Evidencia | Notas |
|---|---|---|---|---|
| FLOW-A-01 | NOT RUN | | | |
| FLOW-A-02 | NOT RUN | | | |
| FLOW-A-03 | NOT RUN | | | |
| FLOW-B-01 | NOT RUN | | | Requiere base limpia |
| FLOW-C-01 | NOT RUN | | | Requiere `newEventCode` libre |
| FLOW-C-02 | NOT RUN | | | |
| FLOW-C-03 | NOT RUN | | | |
| FLOW-D-01 | NOT RUN | | | |
| FLOW-E-01 | NOT RUN | | | |

## Cierre de la corrida

| Campo | Valor |
|---|---|
| Resultado final | NOT RUN |
| Casos PASS | 0 |
| Casos FAIL | 0 |
| Casos BLOCKED | 0 |
| Casos NOT RUN | 99 |
| Incidencias abiertas | 5 observaciones conocidas (ver Defectos y observaciones conocidos); no se ejecutó |
| Firma del ejecutor | NOT RUN |

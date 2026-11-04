# Pruebas E2E manuales de PulsePass

Esta carpeta contiene la Fase B de pruebas end-to-end manuales. No hay Runner,
Newman, scripts de Pre-request ni scripts de Tests. Cada caso se envía desde
Postman con **Send** y se evalúa contra el estado HTTP y el cuerpo observados.

El objetivo es demostrar los flujos principales, las reglas de negocio y los
controles de seguridad de la API real, sin automatizar las aserciones.

## Artefactos

| Archivo | Contenido |
|---|---|
| `postman/PulsePass-Manual-E2E.postman_collection.json` | 99 requests organizados en 10 carpetas. |
| `postman/PulsePass-local.postman_environment.json` | 29 variables locales; las sensibles están vacías y marcadas como `secret`. |
| `fixtures/seed-e2e.sql` | Fixture de venue, eventos, usuarios privilegiados, roles y ticket aislado. |
| `fixtures/README.md` | Preparación de la base, hashes, casos externos y repetición. |
| `checklist-e2e-manual.md` | Lista de los 91 casos con actor y resultado esperado. |
| `registro-ejecucion-manual.md` | Plantilla para registrar la corrida. |
| `matriz-cobertura.md` | Cobertura de rutas, reglas y brechas conocidas. |

La colección y el ambiente son archivos JSON reales del repositorio. No se
generan con Python, bash ni ningún otro script.

## Requisitos

- Java 21.
- PostgreSQL local con acceso administrativo para crear `pulsepass_e2e`.
- Postman de escritorio.
- La aplicación PulsePass arrancada con Flyway y una clave JWT válida.

No se necesita Maven instalado: el proyecto incluye `demo/mvnw`.

## Preparación

### 1. Base de datos y aplicación

Sigue `fixtures/README.md`. En resumen:

1. Crea la base `pulsepass_e2e`.
2. Arranca la aplicación con `SPRING_DATASOURCE_URL` apuntando a esa base y con
   `PULSEPASS_JWT_SECRET_BASE64` definido.
3. Aplica `fixtures/seed-e2e.sql` con los hashes BCrypt de admin, staff e
   inactivo.

La aplicación debe quedar disponible en `http://localhost:8080`, que es el valor
inicial de `baseUrl`.

### 2. Importar en Postman

1. Importa `postman/PulsePass-local.postman_environment.json`.
2. Importa `postman/PulsePass-Manual-E2E.postman_collection.json`.
3. Selecciona el ambiente `PulsePass-local`.
4. Completa `adminIdentifier`, `adminPassword`, `staffIdentifier` y
   `staffPassword`.
5. Deja vacías las variables de token hasta que cada login las produzca.
6. Confirma que las variables sensibles siguen marcadas como `secret`.

Las contraseñas de USER_A y USER_B se eligen al registrar los usuarios. Deben
tener al menos 12 caracteres. Se escriben solo en el ambiente local de Postman y
no se versionan.

## Ejecución

No uses Collection Runner. Ejecuta las carpetas en este orden y registra cada
resultado en `registro-ejecucion-manual.md`.

| Orden | Carpeta | Propósito |
|---|---|---|
| 1 | `00 Preparación / conectividad` | Verificar que la API responde. |
| 2 | `01 Venues` | Consultar el venue del seed. |
| 3 | `02 Artists` | Obtener `artistId` de Solar Beat. |
| 4 | `03 Auth / usuarios` | Registrar USER_A/B, iniciar sesión y probar autenticación. |
| 5 | `04 Usuarios / consulta y propiedad` | Consultar email/username propios y permitir ADMIN. |
| 6 | `05 Events / administración y visibilidad` | Crear, asociar, publicar y consultar eventos. |
| 7 | `06 Tickets / compra, consulta y ciclo de vida` | Comprar, listar por usuario, cancelar, usar y agotar aforo. |
| 8 | `07 Seguridad / escenarios negativos` | Probar 401, 403, 404 e inyección de rol. |
| 9 | `08 Validaciones y errores HTTP` | Probar 400, 404 y 405. |
| 10 | `09 Flujos de negocio / secuencia recomendada` | Smoke de flujos completos en una base limpia. |

### Dependencias dentro de la corrida

- `00` debe ejecutarse primero. Si falla, detén la corrida.
- `01` y `02` requieren el seed aplicado.
- En `02`, ejecuta primero `TC-ART-03`, copia el `id` de Solar Beat en
  `artistId` y después ejecuta `TC-ART-01` y `TC-ART-02`.
- En `03`, registra primero USER_A y USER_B. El duplicado de USER_A debe
  ejecutarse después del registro.
- Copia el `accessToken` de cada login en `userAToken`, `userBToken`,
  `staffToken` y `adminToken` según corresponda.
- En `04`, `TC-USR-03-nominal` requiere `userBToken`; `TC-SEC-007` usa
  `userAToken` y debe devolver 403 por consultar un usuario ajeno.
- En `05`, obtén `artistId` desde `TC-ART-03` y ejecuta `TC-BIZ-005` antes de
  `TC-BIZ-004`.
- En `06`, copia el `ticketCode` de `TC-BIZ-007` en `ticketCancelableCode` y el
  de `TC-BIZ-012` en `ticketUsableCode`.
- En `06`, ejecuta `TC-TKT-03-nominal` después de `TC-BIZ-007`; `TC-SEC-010` usa
  USER_B y debe devolver 403 por listar tickets ajenos.
- `E2E-EVENT-PUBLISHED` tiene capacidad 3. No agregues compras fuera de la
  secuencia prevista.
- `TC-BIZ-014-CAP-3` deja `E2E-EVENT-TO-PUBLISH` en SOLD_OUT. `CAP-4` debe
  devolver 409.
- `TC-SEC-014` consume `E2E-TICKET-SEC14`. Vuelve a aplicar el seed si necesitas
  repetir solo ese caso.
- `TC-SEC-016-R` sobrescribe temporalmente `userBToken`. Restaura el token
  original de USER_B después de `TC-SEC-016-A`.
- Los casos externos `TC-AUTH-010`, `TC-AUTH-011`, `TC-AUTH-013` y
  `TC-SEC-017` requieren los procedimientos de `fixtures/README.md`.

### La carpeta 09 es un smoke aparte

`09` repite operaciones de las carpetas anteriores. En una base ya usada, el
registro de USER_A y la creación de `newEventCode` pueden devolver 409. Ejecuta
`09` sobre una base recién recreada y con el seed aplicado, o trátala como una
corrida independiente. No mezcles `09` con una corrida ya avanzada y declares
PASS sin revisar esas dependencias.

## Criterios de evaluación

- Compara el código HTTP con el esperado del nombre y la descripción del request.
- Revisa que el cuerpo no exponga `passwordHash`, tokens, stacktraces ni datos
  internos.
- Para 401 y 403, verifica el contrato uniforme de `ErrorResponse`.
- Para 404 de borradores, confirma que no se filtran nombre, venue ni artistas.
- Para 409, confirma que no se creó ni mutó el recurso.
- Para 201, confirma que la respuesta no incluye credenciales.
- Un 200 con cuerpo inesperado no es PASS. Registra la diferencia.

Contrato de error:

| Campo | Contenido |
|---|---|
| `timestamp` | Fecha y hora de la respuesta. |
| `status` | Código HTTP. |
| `error` | Frase estándar del código. |
| `message` | Mensaje funcional o genérico de seguridad. |
| `details` | Mapa de errores de validación; vacío cuando no aplica. |

Política de propiedad:

| Situación | Código |
|---|---|
| Recurso existente y ajeno con identidad válida | 403 |
| Recurso inexistente | 404 |
| Borrador de evento consultado por anónimo o USER | 404 |

## Estado actual

La colección y el ambiente fueron escritos y están listos para importar. **No se
ha ejecutado la colección contra una API levantada en esta sesión.** El registro
inicial está en `NOT RUN`; no declares PASS sin evidencia manual.

La colección cubre 99 requests y las 22 rutas lógicas. Las brechas de reglas y
los casos planificados que no están incluidos se documentan en
`matriz-cobertura.md`.

## Seguridad

- No versionar contraseñas, hashes, tokens ni la clave JWT.
- No usar el secreto real para fabricar tokens de prueba.
- No reutilizar datos personales reales.
- No ejecutar el seed fuera de `pulsepass_e2e`.
- No hacer commit de capturas con tokens o contraseñas visibles.

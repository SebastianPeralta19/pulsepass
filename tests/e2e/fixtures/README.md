# Fixtures E2E de PulsePass

Este directorio contiene el estado inicial controlado para ejecutar la colección
`PulsePass-Manual-E2E.postman_collection.json` sin depender de datos históricos
ni de scripts de automatización.

## Archivos

| Archivo | Uso |
|---|---|
| `seed-e2e.sql` | Crea venue, eventos, usuarios privilegiados, perfiles, roles y el ticket aislado para TC-SEC-014. |

No hay scripts de generación, Newman ni utilidades automáticas. El fixture se
aplica manualmente con `psql`.

## Base de datos

El seed está protegido por un bloque que exige que la base actual se llame
exactamente `pulsepass_e2e`. Si se ejecuta sobre cualquier otra base, aborta.

Crea una base limpia antes de la primera corrida:

```bash
createdb -h localhost -U postgres pulsepass_e2e
```

La aplicación debe arrancar apuntando a esa base para que Flyway aplique las
migraciones V1 a V4. Desde la raíz del repositorio:

```bash
export PULSEPASS_JWT_SECRET_BASE64="$(openssl rand -base64 32)"
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/pulsepass_e2e"
export SPRING_DATASOURCE_USERNAME="postgres"
export SPRING_DATASOURCE_PASSWORD="postgres"
cd demo
./mvnw spring-boot:run
```

Cuando la aplicación termine de arrancar, aplica el seed desde otra terminal.
La aplicación puede seguir corriendo: el seed solo inserta o actualiza filas del
fixture.

## Hashes BCrypt

El repositorio no contiene contraseñas ni hashes. El seed recibe tres hashes
BCrypt como variables de `psql`:

| Variable | Usuario | Rol |
|---|---|---|
| `admin_hash` | `e2e_admin` | `ADMIN` |
| `staff_hash` | `e2e_staff` | `STAFF` |
| `inactive_hash` | `e2e_inactive` | `USER` |

Genera los hashes fuera de la base de datos con el mismo `BCryptPasswordEncoder`
del proyecto o con una herramienta local de confianza. Usa contraseñas de al
menos 12 caracteres. No guardes los hashes ni las contraseñas en el repositorio.

Si tienes `htpasswd` disponible, puedes generar los valores en la shell sin
escribirlos en un archivo:

```bash
ADMIN_HASH="$(htpasswd -bnBC 12 "" "$ADMIN_PASSWORD" | tr -d ':\n')"
STAFF_HASH="$(htpasswd -bnBC 12 "" "$STAFF_PASSWORD" | tr -d ':\n')"
INACTIVE_HASH="$(htpasswd -bnBC 12 "" "$INACTIVE_PASSWORD" | tr -d ':\n')"
```

Verifica que el prefijo del hash sea aceptado por Spring Security. Si tienes
dudas, genera los hashes con el encoder del propio proyecto.

## Aplicar el seed

Desde la raíz del repositorio, con las variables de hash ya definidas:

```bash
psql -h localhost -U postgres -d pulsepass_e2e \
  -v ON_ERROR_STOP=1 \
  -v admin_hash="$ADMIN_HASH" \
  -v staff_hash="$STAFF_HASH" \
  -v inactive_hash="$INACTIVE_HASH" \
  -f tests/e2e/fixtures/seed-e2e.sql
```

Después del seed, completa en Postman el ambiente `PulsePass-local`:

| Variable | Valor |
|---|---|
| `adminIdentifier` | `e2e_admin` |
| `adminPassword` | La contraseña cuyo hash se pasó como `admin_hash` |
| `staffIdentifier` | `e2e_staff` |
| `staffPassword` | La contraseña cuyo hash se pasó como `staff_hash` |

Las contraseñas se escriben solo en el ambiente local de Postman y nunca se
versionan.

## Datos creados

| Recurso | Valor |
|---|---|
| Venue | `E2E-VENUE-ACTIVE`, capacidad 3, activo |
| Evento borrador | `E2E-EVENT-DRAFT`, DRAFT, 2035-12-31 20:00, edad mínima 18 |
| Evento publicado | `E2E-EVENT-PUBLISHED`, PUBLISHED, 2035-12-31 20:00, edad mínima 18 |
| Evento por publicar | `E2E-EVENT-TO-PUBLISH`, DRAFT, 2035-12-31 20:00, edad mínima 18 |
| Evento aislado | `E2E-EVENT-STAFF-USE`, PUBLISHED, 2035-12-31 20:00, edad mínima 18 |
| Admin | `e2e_admin`, rol `ADMIN` |
| Staff | `e2e_staff`, rol `STAFF` |
| Inactivo | `e2e_inactive`, activo=false, rol `USER` |
| Propietario del ticket | `e2e_ticket_owner`, rol `USER`, sin credencial |
| Ticket del seed | `E2E-TICKET-SEC14`, PAID, GENERAL, evento `E2E-EVENT-STAFF-USE` |

USER_A y USER_B no se siembran: se registran desde la colección con
`e2e_user_a` y `e2e_user_b`.

## Por qué el ticket del seed usa un evento aparte

El aforo se calcula por evento usando la capacidad del venue. Si
`E2E-TICKET-SEC14` estuviera en `E2E-EVENT-PUBLISHED`, consumiría uno de los
tres cupos y rompería las compras de TC-BIZ-007, TC-BIZ-012 y FLOW-D. Por eso el
ticket vive en `E2E-EVENT-STAFF-USE`.

TC-SEC-014 consume el ticket y lo deja en USED. Para repetir solo ese caso,
vuelve a aplicar el seed: la fila se restaura a PAID.

## Preparaciones externas

Los siguientes casos no se pueden resolver solo con el seed y el ambiente. La
colección conserva la frase `requiere preparación externa, ver fixtures/README.md`
en sus descripciones.

### TC-AUTH-010 · JWT expirado

Opción recomendada, sin tocar el secreto real:

1. Detén la aplicación.
2. Arráncala con `PULSEPASS_JWT_ACCESS_TTL=PT1S`.
3. Ejecuta el login de USER_A y copia el token en `userAToken`.
4. Espera al menos dos segundos.
5. Envía TC-AUTH-010. Debe devolver 401.
6. Restaura el TTL normal, vuelve a iniciar sesión y restaura `userAToken`.

### TC-AUTH-011 · JWT con otra clave o issuer

Genera fuera de la aplicación un token firmado con una clave distinta o con un
issuer distinto. Nunca uses el secreto real ni lo escribas en el repositorio.

1. Copia el token inválido en `userBToken`.
2. Ejecuta TC-AUTH-011. Debe devolver 401.
3. Restaura el token válido de USER_B.

### TC-AUTH-013 · Usuario inactivo con token previo

1. Inicia sesión como USER_B y conserva su token en `userBToken`.
2. Desactiva la cuenta:

```sql
UPDATE users SET active = FALSE WHERE username = 'e2e_user_b';
```

3. Ejecuta TC-AUTH-013. Debe devolver 401.
4. Reactiva la cuenta:

```sql
UPDATE users SET active = TRUE WHERE username = 'e2e_user_b';
```

5. El token anterior sigue siendo válido para la firma, pero el filtro vuelve a
   cargar el usuario. Puedes reutilizarlo después de reactivar la cuenta.

### TC-SEC-017 · STAFF con rol revocado

1. Inicia sesión como STAFF y conserva el token en `staffToken`.
2. Retira el rol:

```sql
DELETE FROM user_roles
WHERE user_id = (SELECT id FROM users WHERE username = 'e2e_staff')
  AND role = 'STAFF';
```

3. Ejecuta TC-SEC-017. Debe devolver 403.
4. Restaura el rol:

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'STAFF' FROM users WHERE username = 'e2e_staff'
ON CONFLICT (user_id, role) DO NOTHING;
```

## TC-SEC-016 y el token temporal

TC-SEC-016-R inicia sesión con el usuario creado con `role: ADMIN` inyectado.
Su token se copia temporalmente en `userBToken` para ejecutar TC-SEC-016-A.
Después del caso, restaura el token original de USER_B antes de continuar.

## Repetir la corrida completa

El seed es idempotente para las filas del fixture, pero no borra usuarios,
tickets ni eventos creados por la colección. Para una corrida limpia:

1. Detén la aplicación.
2. Elimina y recrea la base:

```bash
dropdb -h localhost -U postgres --if-exists pulsepass_e2e
createdb -h localhost -U postgres pulsepass_e2e
```

3. Arranca la aplicación para que Flyway aplique V1 a V4.
4. Aplica el seed nuevamente.
5. Reinicia el ambiente de Postman o vuelve a completar los secretos, porque
   las variables de sesión y los tokens deben tratarse como descartables.

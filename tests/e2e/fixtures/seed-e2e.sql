\set ON_ERROR_STOP on

-- Fixture manual de PulsePass E2E.
-- Objetivo: preparar infraestructura estable para la colección Postman.
-- No crea USER_A ni USER_B: esos usuarios se registran desde la colección.
-- No contiene contraseñas ni hashes: los hashes BCrypt llegan como variables psql.
--
-- Variables obligatorias:
--   admin_hash
--   staff_hash
--   inactive_hash
--
-- Uso desde psql:
--   \i tests/e2e/fixtures/seed-e2e.sql
-- pasando las variables con -v admin_hash=... -v staff_hash=... -v inactive_hash=...
--
-- El bloque de guarda impide aplicar el fixture sobre una base distinta de
-- pulsepass_e2e.

DO $$
BEGIN
    IF current_database() <> 'pulsepass_e2e' THEN
        RAISE EXCEPTION 'seed-e2e.sql solo puede aplicarse sobre pulsepass_e2e (base actual: %)', current_database();
    END IF;
END
$$;

BEGIN;

-- ---------------------------------------------------------------------------
-- Venue dedicado. Capacidad 3 para poder agotar el aforo en pocos pasos.
-- ---------------------------------------------------------------------------
INSERT INTO venues (code, name, city, address, capacity, active)
VALUES ('E2E-VENUE-ACTIVE', 'E2E Arena', 'Bogota', 'Calle E2E 123', 3, TRUE)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    city = EXCLUDED.city,
    address = EXCLUDED.address,
    capacity = EXCLUDED.capacity,
    active = EXCLUDED.active;

-- ---------------------------------------------------------------------------
-- Eventos del fixture.
--   E2E-EVENT-DRAFT         visible solo para STAFF/ADMIN.
--   E2E-EVENT-PUBLISHED     evento base para compras, consultas y capacidad.
--   E2E-EVENT-TO-PUBLISH    se asocia y publica durante la colección.
--   E2E-EVENT-STAFF-USE     evento aislado para el ticket del seed.
--
-- Las fechas quedan lejos del presente para no depender del reloj de la máquina.
-- ---------------------------------------------------------------------------
INSERT INTO events (event_code, name, description, category, status, event_date, minimum_age, venue_id)
VALUES (
    'E2E-EVENT-DRAFT',
    'PulsePass E2E Borrador',
    'Evento DRAFT del fixture manual',
    'MUSIC',
    'DRAFT',
    TIMESTAMP '2035-12-31 20:00:00',
    18,
    (SELECT id FROM venues WHERE code = 'E2E-VENUE-ACTIVE')
)
ON CONFLICT (event_code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    status = EXCLUDED.status,
    event_date = EXCLUDED.event_date,
    minimum_age = EXCLUDED.minimum_age,
    venue_id = EXCLUDED.venue_id;

INSERT INTO events (event_code, name, description, category, status, event_date, minimum_age, venue_id)
VALUES (
    'E2E-EVENT-PUBLISHED',
    'PulsePass E2E Publicado',
    'Evento PUBLISHED del fixture manual',
    'MUSIC',
    'PUBLISHED',
    TIMESTAMP '2035-12-31 20:00:00',
    18,
    (SELECT id FROM venues WHERE code = 'E2E-VENUE-ACTIVE')
)
ON CONFLICT (event_code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    status = EXCLUDED.status,
    event_date = EXCLUDED.event_date,
    minimum_age = EXCLUDED.minimum_age,
    venue_id = EXCLUDED.venue_id;

INSERT INTO events (event_code, name, description, category, status, event_date, minimum_age, venue_id)
VALUES (
    'E2E-EVENT-TO-PUBLISH',
    'PulsePass E2E Por Publicar',
    'Evento DRAFT que la colección asocia y publica',
    'MUSIC',
    'DRAFT',
    TIMESTAMP '2035-12-31 20:00:00',
    18,
    (SELECT id FROM venues WHERE code = 'E2E-VENUE-ACTIVE')
)
ON CONFLICT (event_code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    status = EXCLUDED.status,
    event_date = EXCLUDED.event_date,
    minimum_age = EXCLUDED.minimum_age,
    venue_id = EXCLUDED.venue_id;

INSERT INTO events (event_code, name, description, category, status, event_date, minimum_age, venue_id)
VALUES (
    'E2E-EVENT-STAFF-USE',
    'PulsePass E2E Staff Use',
    'Evento aislado para el ticket E2E-TICKET-SEC14',
    'MUSIC',
    'PUBLISHED',
    TIMESTAMP '2035-12-31 20:00:00',
    18,
    (SELECT id FROM venues WHERE code = 'E2E-VENUE-ACTIVE')
)
ON CONFLICT (event_code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    status = EXCLUDED.status,
    event_date = EXCLUDED.event_date,
    minimum_age = EXCLUDED.minimum_age,
    venue_id = EXCLUDED.venue_id;

-- ---------------------------------------------------------------------------
-- Usuarios privilegiados y usuarios de apoyo.
-- Admin, STAFF e inactivo reciben credencial BCrypt desde variables psql.
-- El propietario del ticket del seed no necesita iniciar sesión.
-- ---------------------------------------------------------------------------
INSERT INTO users (username, email, active)
VALUES ('e2e_admin', 'e2e.admin@example.test', TRUE)
ON CONFLICT (username) DO UPDATE
SET email = EXCLUDED.email,
    active = EXCLUDED.active;

INSERT INTO users (username, email, active)
VALUES ('e2e_staff', 'e2e.staff@example.test', TRUE)
ON CONFLICT (username) DO UPDATE
SET email = EXCLUDED.email,
    active = EXCLUDED.active;

INSERT INTO users (username, email, active)
VALUES ('e2e_inactive', 'e2e.inactive@example.test', FALSE)
ON CONFLICT (username) DO UPDATE
SET email = EXCLUDED.email,
    active = EXCLUDED.active;

INSERT INTO users (username, email, active)
VALUES ('e2e_ticket_owner', 'e2e.ticket.owner@example.test', TRUE)
ON CONFLICT (username) DO UPDATE
SET email = EXCLUDED.email,
    active = EXCLUDED.active;

-- Perfiles: datos mínimos estables para las respuestas y reglas de edad.
INSERT INTO user_profiles (first_name, last_name, phone, city, birth_date, user_id)
SELECT 'E2E', 'Admin', '3100000001', 'Bogota', DATE '1990-01-01', id
FROM users
WHERE username = 'e2e_admin'
ON CONFLICT (user_id) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    birth_date = EXCLUDED.birth_date;

INSERT INTO user_profiles (first_name, last_name, phone, city, birth_date, user_id)
SELECT 'E2E', 'Staff', '3100000002', 'Bogota', DATE '1990-01-01', id
FROM users
WHERE username = 'e2e_staff'
ON CONFLICT (user_id) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    birth_date = EXCLUDED.birth_date;

INSERT INTO user_profiles (first_name, last_name, phone, city, birth_date, user_id)
SELECT 'E2E', 'Inactivo', '3100000003', 'Bogota', DATE '1990-01-01', id
FROM users
WHERE username = 'e2e_inactive'
ON CONFLICT (user_id) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    birth_date = EXCLUDED.birth_date;

INSERT INTO user_profiles (first_name, last_name, phone, city, birth_date, user_id)
SELECT 'E2E', 'Ticket Owner', '3100000004', 'Bogota', DATE '1990-01-01', id
FROM users
WHERE username = 'e2e_ticket_owner'
ON CONFLICT (user_id) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    birth_date = EXCLUDED.birth_date;

-- Credenciales: el hash nunca se escribe en el repositorio.
INSERT INTO user_credentials (user_id, password_hash, password_changed_at)
SELECT id, :'admin_hash', NOW()
FROM users
WHERE username = 'e2e_admin'
ON CONFLICT (user_id) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    password_changed_at = EXCLUDED.password_changed_at;

INSERT INTO user_credentials (user_id, password_hash, password_changed_at)
SELECT id, :'staff_hash', NOW()
FROM users
WHERE username = 'e2e_staff'
ON CONFLICT (user_id) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    password_changed_at = EXCLUDED.password_changed_at;

INSERT INTO user_credentials (user_id, password_hash, password_changed_at)
SELECT id, :'inactive_hash', NOW()
FROM users
WHERE username = 'e2e_inactive'
ON CONFLICT (user_id) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    password_changed_at = EXCLUDED.password_changed_at;

-- Roles: en base de datos se guardan sin el prefijo ROLE_.
INSERT INTO user_roles (user_id, role)
SELECT id, 'ADMIN' FROM users WHERE username = 'e2e_admin'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'STAFF' FROM users WHERE username = 'e2e_staff'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'USER' FROM users WHERE username = 'e2e_inactive'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'USER' FROM users WHERE username = 'e2e_ticket_owner'
ON CONFLICT (user_id, role) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Ticket aislado para TC-SEC-014.
-- Se restaura a PAID en cada aplicación del seed para permitir repetir el caso
-- sin recrear la base completa. El evento dedicado no interfiere con el aforo
-- de E2E-EVENT-PUBLISHED.
-- ---------------------------------------------------------------------------
INSERT INTO tickets (ticket_code, type, price, status, purchase_date, user_id, event_id)
SELECT
    'E2E-TICKET-SEC14',
    'GENERAL',
    100.00,
    'PAID',
    NOW(),
    owner.id,
    event.id
FROM users owner
CROSS JOIN events event
WHERE owner.username = 'e2e_ticket_owner'
  AND event.event_code = 'E2E-EVENT-STAFF-USE'
ON CONFLICT (ticket_code) DO UPDATE
SET type = EXCLUDED.type,
    price = EXCLUDED.price,
    status = 'PAID',
    purchase_date = EXCLUDED.purchase_date,
    user_id = EXCLUDED.user_id,
    event_id = EXCLUDED.event_id;

COMMIT;

\echo 'Fixture PulsePass E2E aplicado sobre pulsepass_e2e.'

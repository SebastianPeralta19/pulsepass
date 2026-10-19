-- Fase 4 - Capa de seguridad: credenciales y roles.
-- Migracion incremental posterior a V1-V3. No reescribe migraciones aplicadas.

CREATE TABLE user_credentials (
    user_id BIGINT PRIMARY KEY,
    password_hash VARCHAR(100) NOT NULL,
    password_changed_at TIMESTAMP,
    CONSTRAINT fk_user_credentials_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role VARCHAR(30) NOT NULL,
    CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_user_roles_role CHECK (role IN ('USER', 'STAFF', 'ADMIN'))
);

CREATE INDEX idx_user_roles_user_id ON user_roles (user_id);

-- Los usuarios legados (creados en las fases 1-3) quedan sin credenciales y por lo tanto
-- sin posibilidad de iniciar sesion. No se asigna ninguna contrasena por defecto.
--
-- Activacion segura de una cuenta preexistente (proceso administrativo, fuera del registro publico):
--   1. Generar un hash BCrypt fuera de la base de datos, p. ej. con BCryptPasswordEncoder.
--   2. Registrar credencial y rol mediante un proceso controlado:
--        INSERT INTO user_credentials (user_id, password_hash, password_changed_at)
--        VALUES (:userId, :bcryptHash, NOW());
--        INSERT INTO user_roles (user_id, role) VALUES (:userId, 'USER')
--        ON CONFLICT (user_id, role) DO NOTHING;
--   3. Los roles STAFF y ADMIN se asignan unicamente por este procedimiento o por una
--      semilla local controlada; nunca por parametros HTTP del cliente.

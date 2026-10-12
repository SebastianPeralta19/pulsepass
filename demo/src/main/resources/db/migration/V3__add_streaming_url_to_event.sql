-- TODO: migración V3 - añadir columna streaming_url a event
ALTER TABLE events
    ADD COLUMN streaming_url VARCHAR(500);
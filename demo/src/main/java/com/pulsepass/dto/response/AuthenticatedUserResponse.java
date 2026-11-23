package com.pulsepass.dto.response;

import java.util.List;

/**
 * Información mínima del usuario autenticado (GET /api/auth/me).
 * Nunca incluye hash de contraseña, tokens ni secretos.
 */
public record AuthenticatedUserResponse(
        Long id,
        String username,
        String email,
        boolean active,
        List<String> roles
) {
}

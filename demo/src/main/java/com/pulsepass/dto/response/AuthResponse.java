package com.pulsepass.dto.response;

/**
 * Respuesta de POST /api/auth/login. No incluye datos sensibles.
 */
public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn
) {
}

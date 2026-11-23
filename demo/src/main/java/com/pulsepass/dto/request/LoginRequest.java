package com.pulsepass.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Credenciales de inicio de sesión. El identificador acepta usuario o correo.
 */
public record LoginRequest(
        @NotBlank(message = "Identifier is required")
        String identifier,

        @NotBlank(message = "Password is required")
        String password
) {
}

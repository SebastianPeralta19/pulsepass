package com.pulsepass.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Configuración del token de acceso, parametrizada por entorno.
 * La clave secreta nunca se versiona: se inyecta con
 * PULSEPASS_JWT_SECRET_BASE64.
 */
@ConfigurationProperties(prefix = "pulsepass.security.jwt")
public record JwtProperties(
        String issuer,
        String secretBase64,
        Duration accessTokenTtl
) {
}

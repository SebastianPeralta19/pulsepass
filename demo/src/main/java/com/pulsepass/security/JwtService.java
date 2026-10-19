package com.pulsepass.security;

import com.pulsepass.exception.InvalidTokenException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Emite y valida JWT firmados con HS256. No consulta tickets ni ejecuta
 * negocio: sólo firma, verifica integridad, emisor, fechas y sujeto.
 */
@Service
public class JwtService {

    /** Longitud mínima exigida para la clave HMAC (256 bits). */
    static final int MIN_SECRET_BYTES = 32;

    private final String issuer;
    private final Duration accessTokenTtl;
    private final SecretKey key;
    private final Clock clock;

    public JwtService(JwtProperties properties, Clock clock) {
        this.issuer = requireIssuer(properties.issuer());
        this.accessTokenTtl = requireTtl(properties.accessTokenTtl());
        this.key = buildKey(properties.secretBase64());
        this.clock = clock;
    }

    /**
     * Genera un token de acceso. El sujeto es el id persistente e inmutable del
     * usuario; nunca se incluyen contraseñas ni datos sensibles.
     */
    public String generateAccessToken(UserPrincipal principal) {
        Instant now = clock.instant();
        return Jwts.builder()
                .subject(String.valueOf(principal.getId()))
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenTtl)))
                .id(UUID.randomUUID().toString())
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Verifica firma, emisor, expiración y sujeto, y devuelve el id del usuario.
     *
     * @throws InvalidTokenException si el token es inválido, está vencido,
     *                               manipulado o fue emitido por otro emisor.
     */
    public Long extractUserId(String token) {
        if (token == null || token.isBlank()) {
            throw new InvalidTokenException("Access token is missing");
        }
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(issuer)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            if (claims.getIssuer() == null || !issuer.equals(claims.getIssuer())) {
                throw new InvalidTokenException("Unexpected token issuer");
            }
            String subject = claims.getSubject();
            if (subject == null || subject.isBlank()) {
                throw new InvalidTokenException("Token subject is missing");
            }
            Date expiration = claims.getExpiration();
            if (expiration == null || !expiration.toInstant().isAfter(clock.instant())) {
                throw new InvalidTokenException("Token is expired or has no expiration");
            }
            return Long.parseLong(subject);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new InvalidTokenException("Access token is invalid", ex);
        }
    }

    public long accessTokenTtlSeconds() {
        return accessTokenTtl.toSeconds();
    }

    private static String requireIssuer(String issuer) {
        if (issuer == null || issuer.isBlank()) {
            throw new IllegalStateException("pulsepass.security.jwt.issuer must be configured");
        }
        return issuer;
    }

    private static Duration requireTtl(Duration ttl) {
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            throw new IllegalStateException("pulsepass.security.jwt.access-token-ttl must be positive");
        }
        return ttl;
    }

    private static SecretKey buildKey(String secretBase64) {
        if (secretBase64 == null || secretBase64.isBlank()) {
            throw new IllegalStateException(
                    "pulsepass.security.jwt.secret-base64 is required (set PULSEPASS_JWT_SECRET_BASE64)");
        }
        byte[] decoded;
        try {
            decoded = Decoders.BASE64.decode(secretBase64);
        } catch (RuntimeException ex) {
            throw new IllegalStateException("pulsepass.security.jwt.secret-base64 must be valid Base64", ex);
        }
        if (decoded.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "pulsepass.security.jwt.secret-base64 must decode to at least " + MIN_SECRET_BYTES + " bytes");
        }
        return Keys.hmacShaKeyFor(decoded);
    }
}

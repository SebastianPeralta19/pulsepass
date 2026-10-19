package com.pulsepass.security;

import com.pulsepass.enums.Role;
import com.pulsepass.exception.InvalidTokenException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * FR-SEC-AUTH-005..008, SEC-004/005: el token debe ser firmado, verificado y
 * rechazado ante manipulación, vencimiento o emisor distinto.
 */
class JwtServiceTest {

    private static final String SECRET = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
    private static final String ISSUER = "pulsepass-api-test";
    private static final Duration TTL = Duration.ofMinutes(15);
    private static final Instant NOW = Instant.parse("2026-10-19T10:00:00Z");

    private static UserPrincipal principal(long id) {
        return new UserPrincipal(id, "andrea", "andrea@email.com", "hash", true, List.of(Role.USER));
    }

    private static JwtService service(String issuer, String secret, Duration ttl, Instant now) {
        return new JwtService(new JwtProperties(issuer, secret, ttl), Clock.fixed(now, ZoneOffset.UTC));
    }

    private static JwtService service(Instant now) {
        return service(ISSUER, SECRET, TTL, now);
    }

    @Test
    void generateAccessToken_thenExtractUserId_roundTrips() {
        // ARRANGE
        JwtService jwtService = service(NOW);

        // ACT
        String token = jwtService.generateAccessToken(principal(7L));

        // ASSERT
        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUserId(token)).isEqualTo(7L);
    }

    @Test
    void accessTokenTtlSeconds_matchesConfiguredTtl() {
        assertThat(service(NOW).accessTokenTtlSeconds()).isEqualTo(900L);
    }

    // T-SEC-007
    @Test
    void extractUserId_expiredToken_throwsInvalidToken() {
        // ARRANGE: emitido "ahora", validado una hora después.
        String token = service(NOW).generateAccessToken(principal(1L));
        JwtService later = service(NOW.plus(Duration.ofHours(1)));

        // ACT + ASSERT
        assertThatThrownBy(() -> later.extractUserId(token))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void extractUserId_wrongIssuer_throwsInvalidToken() {
        // ARRANGE
        String token = service("issuer-a", SECRET, TTL, NOW).generateAccessToken(principal(1L));
        JwtService otherIssuer = service("issuer-b", SECRET, TTL, NOW);

        // ACT + ASSERT
        assertThatThrownBy(() -> otherIssuer.extractUserId(token))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("invalid");
    }

    // T-SEC-008
    @Test
    void extractUserId_tamperedSignature_throwsInvalidToken() {
        // ARRANGE
        JwtService jwtService = service(NOW);
        String token = jwtService.generateAccessToken(principal(1L));
        String tampered = token.substring(0, token.length() - 1)
                + (token.endsWith("A") ? "B" : "A");

        // ACT + ASSERT
        assertThatThrownBy(() -> jwtService.extractUserId(tampered))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void extractUserId_signedWithAnotherKey_throwsInvalidToken() {
        // ARRANGE: otra clave del mismo tamaño.
        String otherSecret = "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5";
        String token = service("pulsepass-api-test", otherSecret, TTL, NOW)
                .generateAccessToken(principal(1L));

        // ACT + ASSERT
        assertThatThrownBy(() -> service(NOW).extractUserId(token))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void extractUserId_nullOrBlankToken_throwsInvalidToken() {
        JwtService jwtService = service(NOW);

        assertThatThrownBy(() -> jwtService.extractUserId(null))
                .isInstanceOf(InvalidTokenException.class);
        assertThatThrownBy(() -> jwtService.extractUserId("  "))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void extractUserId_nonNumericSubject_throwsInvalidToken() {
        // ARRANGE: token bien firmado pero con sujeto no numérico.
        JwtService jwtService = service(NOW);
        String token = Jwts.builder()
                .subject("no-soy-un-id")
                .issuer(ISSUER)
                .issuedAt(Date.from(NOW))
                .expiration(Date.from(NOW.plus(TTL)))
                .id(UUID.randomUUID().toString())
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET)), Jwts.SIG.HS256)
                .compact();

        // ACT + ASSERT
        assertThatThrownBy(() -> jwtService.extractUserId(token))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void extractUserId_missingSubject_throwsInvalidToken() {
        // ARRANGE
        JwtService jwtService = service(NOW);
        String token = Jwts.builder()
                .issuer(ISSUER)
                .issuedAt(Date.from(NOW))
                .expiration(Date.from(NOW.plus(TTL)))
                .id(UUID.randomUUID().toString())
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET)), Jwts.SIG.HS256)
                .compact();

        // ACT + ASSERT
        assertThatThrownBy(() -> jwtService.extractUserId(token))
                .isInstanceOf(InvalidTokenException.class);
    }

    // SEC-005: la aplicación no arranca con una clave ausente o débil.
    @Test
    void constructor_withoutSecret_failsFast() {
        assertThatThrownBy(() -> service(ISSUER, null, TTL, NOW))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("secret-base64");
        assertThatThrownBy(() -> service(ISSUER, "   ", TTL, NOW))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void constructor_withInvalidBase64Secret_failsFast() {
        assertThatThrownBy(() -> service(ISSUER, "no-es-base64-%%%", TTL, NOW))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void constructor_withShortSecret_failsFast() {
        // "corta" en Base64 -> menos de 32 bytes.
        assertThatThrownBy(() -> service(ISSUER, "Y29ydGE=", TTL, NOW))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least");
    }

    @Test
    void constructor_withoutIssuerOrPositiveTtl_failsFast() {
        assertThatThrownBy(() -> service("  ", SECRET, TTL, NOW))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> service(ISSUER, SECRET, Duration.ZERO, NOW))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> service(ISSUER, SECRET, Duration.ofSeconds(-1), NOW))
                .isInstanceOf(IllegalStateException.class);
    }
}

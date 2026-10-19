package com.pulsepass.security;

import com.pulsepass.enums.Role;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import tools.jackson.databind.json.JsonMapper;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FR-SEC-AUTH-006/009 y SEC-006/007: el filtro interpreta el Bearer, construye
 * el contexto desde la base de datos y responde 401 ante cualquier anomalía,
 * sin stacktrace ni datos sensibles.
 */
class JwtAuthenticationFilterTest {

    private static final String SECRET = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
    private static final String ISSUER = "pulsepass-api-test";
    private static final Instant NOW = Instant.parse("2026-10-19T10:00:00Z");

    private JwtService jwtService;
    private CustomUserDetailsService userDetailsService;
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(new JwtProperties(ISSUER, SECRET, Duration.ofMinutes(15)),
                Clock.fixed(NOW, ZoneOffset.UTC));
        userDetailsService = mock(CustomUserDetailsService.class);
        RestAuthenticationEntryPoint entryPoint =
                new RestAuthenticationEntryPoint(JsonMapper.builder().build());
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService, entryPoint);
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private static UserPrincipal principal(long id, boolean enabled, Role... roles) {
        return new UserPrincipal(id, "andrea", "andrea@email.com", "hash", enabled, List.of(roles));
    }

    private static MockHttpServletRequest request(String method, String path) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setServletPath(path);
        return request;
    }

    private static FilterChain chainThat(AtomicBoolean called) {
        return (req, res) -> called.set(true);
    }

    @Test
    void withoutAuthorizationHeader_continuesAnonymously() throws Exception {
        AtomicBoolean called = new AtomicBoolean(false);

        filter.doFilter(request("GET", "/api/events/published"), new MockHttpServletResponse(),
                chainThat(called));

        assertThat(called).isTrue();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void validBearerToken_authenticatesFromDatabase() throws Exception {
        // ARRANGE
        UserPrincipal expected = principal(7L, true, Role.USER, Role.STAFF);
        when(userDetailsService.loadUserById(7L)).thenReturn(expected);
        String token = jwtService.generateAccessToken(expected);
        MockHttpServletRequest request = request("GET", "/api/auth/me");
        request.addHeader("Authorization", "Bearer " + token);
        AtomicBoolean called = new AtomicBoolean(false);

        // ACT
        filter.doFilter(request, new MockHttpServletResponse(), chainThat(called));

        // ASSERT
        assertThat(called).isTrue();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getPrincipal()).isSameAs(expected);
        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .containsExactlyInAnyOrder("ROLE_USER", "ROLE_STAFF");
    }

    @Test
    void invalidBearerToken_returns401AndStopsChain() throws Exception {
        // ARRANGE
        MockHttpServletRequest request = request("GET", "/api/auth/me");
        request.addHeader("Authorization", "Bearer no.es.un.token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean called = new AtomicBoolean(false);

        // ACT
        filter.doFilter(request, response, chainThat(called));

        // ASSERT
        assertThat(called).isFalse();
        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).contains("application/json");
        assertThat(response.getContentAsString())
                .contains("\"status\":401")
                .contains("Authentication is required to access this resource")
                .doesNotContain("stackTrace")
                .doesNotContain("hash");
    }

    @Test
    void multipleAuthorizationHeaders_areRejected() throws Exception {
        MockHttpServletRequest request = request("GET", "/api/auth/me");
        request.addHeader("Authorization", "Bearer uno");
        request.addHeader("Authorization", "Bearer dos");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean called = new AtomicBoolean(false);

        filter.doFilter(request, response, chainThat(called));

        assertThat(called).isFalse();
        assertThat(response.getStatus()).isEqualTo(401);
    }

    @Test
    void emptyBearerToken_isRejected() throws Exception {
        MockHttpServletRequest request = request("GET", "/api/auth/me");
        request.addHeader("Authorization", "Bearer    ");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean called = new AtomicBoolean(false);

        filter.doFilter(request, response, chainThat(called));

        assertThat(called).isFalse();
        assertThat(response.getStatus()).isEqualTo(401);
    }

    @Test
    void nonBearerScheme_isIgnored() throws Exception {
        MockHttpServletRequest request = request("GET", "/api/auth/me");
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz");
        AtomicBoolean called = new AtomicBoolean(false);

        filter.doFilter(request, new MockHttpServletResponse(), chainThat(called));

        assertThat(called).isTrue();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    // T-SEC-016: un token vigente de un usuario inactivo no autentica.
    @Test
    void validTokenForDisabledUser_doesNotAuthenticate() throws Exception {
        // ARRANGE
        UserPrincipal disabled = principal(4L, false, Role.USER);
        when(userDetailsService.loadUserById(4L)).thenReturn(disabled);
        String token = jwtService.generateAccessToken(disabled);
        MockHttpServletRequest request = request("GET", "/api/auth/me");
        request.addHeader("Authorization", "Bearer " + token);
        AtomicBoolean called = new AtomicBoolean(false);

        // ACT
        filter.doFilter(request, new MockHttpServletResponse(), chainThat(called));

        // ASSERT: la cadena decide (ruta protegida -> 401), pero el filtro no autentica.
        assertThat(called).isTrue();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void existingAuthentication_isNeverOverwritten() throws Exception {
        // ARRANGE
        UserPrincipal existing = principal(1L, true, Role.ADMIN);
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(existing, null, existing.getAuthorities()));
        String token = jwtService.generateAccessToken(principal(2L, true, Role.USER));
        MockHttpServletRequest request = request("GET", "/api/auth/me");
        request.addHeader("Authorization", "Bearer " + token);
        AtomicBoolean called = new AtomicBoolean(false);

        // ACT
        filter.doFilter(request, new MockHttpServletResponse(), chainThat(called));

        // ASSERT
        assertThat(called).isTrue();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
                .isSameAs(existing);
        verify(userDetailsService, never()).loadUserById(anyLong());
    }

    @Test
    void loginPath_isExemptFromTokenValidation() throws Exception {
        // ARRANGE: aunque el cliente envíe un token viejo, el login no se bloquea.
        MockHttpServletRequest request = request("POST", "/api/auth/login");
        request.addHeader("Authorization", "Bearer token-viejo-invalido");
        AtomicBoolean called = new AtomicBoolean(false);

        // ACT
        filter.doFilter(request, new MockHttpServletResponse(), chainThat(called));

        // ASSERT
        assertThat(called).isTrue();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}

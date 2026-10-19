package com.pulsepass.security;

import com.pulsepass.exception.InvalidTokenException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

/**
 * Lee el encabezado Authorization: Bearer, valida el JWT y construye el
 * contexto de seguridad a partir de la identidad persistida. No crea cuentas
 * ni persiste tokens.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   CustomUserDetailsService userDetailsService,
                                   RestAuthenticationEntryPoint authenticationEntryPoint) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    /**
     * El login no debe bloquearse por un token viejo enviado por el cliente.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return "/api/auth/login".equals(request.getServletPath());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        List<String> headers = Collections.list(request.getHeaders(AUTHORIZATION_HEADER));
        if (headers.isEmpty()) {
            // Sin Bearer: la cadena decide si la ruta es pública.
            filterChain.doFilter(request, response);
            return;
        }
        if (headers.size() > 1) {
            reject(request, response, "Multiple Authorization headers");
            return;
        }

        String header = headers.get(0);
        if (header == null || !header.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            // Otro esquema de autenticación: no se interpreta aquí.
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            reject(request, response, "Empty bearer token");
            return;
        }

        // Nunca sobrescribir una autenticación ya establecida.
        SecurityContext context = SecurityContextHolder.getContext();
        if (context.getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Long userId = jwtService.extractUserId(token);
            UserPrincipal principal = userDetailsService.loadUserById(userId);
            if (!principal.isEnabled()) {
                // Usuario desactivado: no se autentica aunque el token siga vigente.
                log.warn("Rejected request for disabled user id {}", userId);
                filterChain.doFilter(request, response);
                return;
            }
            UsernamePasswordAuthenticationToken authentication =
                    UsernamePasswordAuthenticationToken.authenticated(
                            principal, null, principal.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            context.setAuthentication(authentication);
            filterChain.doFilter(request, response);
        } catch (InvalidTokenException | UsernameNotFoundException ex) {
            SecurityContextHolder.clearContext();
            log.warn("Rejected bearer token: {}", ex.getMessage());
            authenticationEntryPoint.commence(request, response,
                    new BadCredentialsException("Invalid access token", ex));
        }
    }

    private void reject(HttpServletRequest request, HttpServletResponse response, String reason) throws IOException {
        SecurityContextHolder.clearContext();
        log.warn("Rejected request: {}", reason);
        try {
            authenticationEntryPoint.commence(request, response, new BadCredentialsException(reason));
        } catch (ServletException ex) {
            throw new IOException(ex);
        }
    }
}

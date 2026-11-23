package com.pulsepass.controller;

import com.pulsepass.config.ClockConfig;
import com.pulsepass.config.SecurityConfig;
import com.pulsepass.domain.User;
import com.pulsepass.domain.UserCredential;
import com.pulsepass.domain.UserRole;
import com.pulsepass.enums.Role;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.security.CustomUserDetailsService;
import com.pulsepass.security.JwtService;
import com.pulsepass.security.RestAccessDeniedHandler;
import com.pulsepass.security.RestAuthenticationEntryPoint;
import com.pulsepass.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.Mockito.when;

/**
 * Base de los tests de controlador que pasan por la cadena de seguridad real
 * (T-SEC-020): los tests previos dejan de ver rutas protegidas sin identidad.
 *
 * <p>La identidad se construye con tokens JWT firmados por el {@link JwtService}
 * real y se resuelve contra {@link UserRepository}, de modo que se ejercita el
 * mismo {@code JwtAuthenticationFilter} que en producción. Nunca se usa
 * {@code addFilters = false}.</p>
 */
@Import({SecurityConfig.class, JwtService.class, CustomUserDetailsService.class, ClockConfig.class,
        RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
@ActiveProfiles("test")
public abstract class SecuredControllerTestBase {

    /** Hash BCrypt de relleno: nunca corresponde a una contraseña real. */
    private static final String PLACEHOLDER_HASH = "$2a$10$012345678901234567890uGZ3wY0m9d5k7f5l8q9r0s1t2u3v4w5x6y7z";

    @MockitoBean
    protected UserRepository userRepository;

    @Autowired
    protected JwtService jwtService;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    /** Usuario activo con credencial y roles, listo para autenticarse por token. */
    protected static User user(long id, String username, Role... roles) {
        User user = new User(username, username + "@email.com", true);
        ReflectionTestUtils.setField(user, "id", id);
        for (Role role : roles) {
            user.addRole(new UserRole(user, role));
        }
        user.setCredential(new UserCredential(user, PLACEHOLDER_HASH, LocalDateTime.now()));
        return user;
    }

    /** Usuario con contraseña conocida (para ejercitar el login real). */
    protected static User userWithPassword(long id, String username, String rawPassword,
                                           PasswordEncoder encoder, Role... roles) {
        User user = user(id, username, roles);
        user.setCredential(new UserCredential(user, encoder.encode(rawPassword), LocalDateTime.now()));
        return user;
    }

    /**
     * Registra el usuario como autenticable y devuelve el encabezado
     * {@code Authorization} con un token válido para él.
     */
    protected String bearer(User user) {
        when(userRepository.findPrincipalById(user.getId())).thenReturn(Optional.of(user));
        return "Bearer " + jwtService.generateAccessToken(UserPrincipal.from(user));
    }
}

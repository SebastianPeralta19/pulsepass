package com.pulsepass.service.impl;

import com.pulsepass.domain.User;
import com.pulsepass.domain.UserCredential;
import com.pulsepass.dto.request.LoginRequest;
import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.AuthResponse;
import com.pulsepass.dto.response.AuthenticatedUserResponse;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.enums.Role;
import com.pulsepass.exception.AuthenticationFailedException;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.security.JwtService;
import com.pulsepass.security.UserPrincipal;
import com.pulsepass.service.AuthorizationService;
import com.pulsepass.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FR-SEC-AUTH-001/002/003: registro atómico con BCrypt + ROLE_USER y login
 * contra AuthenticationManager, sin filtrar si el usuario existe.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-19T10:00:00Z"), ZoneOffset.UTC);
    private static final String RAW_PASSWORD = "clave-segura-123";
    private static final String HASH = "$2a$10$hash-de-prueba";

    @Mock
    private UserService userService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthorizationService authorizationService;

    private AuthServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AuthServiceImpl(userService, userRepository, passwordEncoder, authenticationManager,
                jwtService, authorizationService, CLOCK);
    }

    private static RegisterUserRequest registerRequest(String password) {
        return new RegisterUserRequest("andrea", "andrea@email.com", password, "Andrea", "Gomez",
                "3001234567", "Santa Marta", LocalDate.of(2001, 5, 20));
    }

    private static User userWithId(long id) {
        User user = new User("andrea", "andrea@email.com", true);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static UserPrincipal principal(long id, Role... roles) {
        return new UserPrincipal(id, "andrea", "andrea@email.com", HASH, true, List.of(roles));
    }

    // ---------- register ----------

    @Test
    void register_validRequest_encodesPasswordAndGrantsUserRole() {
        // ARRANGE
        UserResponse created = new UserResponse(1L, "andrea", "andrea@email.com", true,
                "Andrea", "Gomez", "3001234567", "Santa Marta", LocalDate.of(2001, 5, 20));
        User user = userWithId(1L);
        when(userService.register(any(RegisterUserRequest.class))).thenReturn(created);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn(HASH);

        // ACT
        UserResponse result = service.register(registerRequest(RAW_PASSWORD));

        // ASSERT
        assertThat(result).isEqualTo(created);
        UserCredential credential = user.getCredential();
        assertThat(credential).isNotNull();
        assertThat(credential.getPasswordHash()).isEqualTo(HASH);
        assertThat(credential.getPasswordChangedAt()).isNotNull();
        // Nunca se otorgan roles privilegiados desde el registro público.
        assertThat(user.getRoleNames()).containsExactly(Role.USER);
        verify(userRepository).save(user);
    }

    @Test
    void register_missingPassword_throwsBusinessRuleBeforeCreatingUser() {
        assertThatThrownBy(() -> service.register(registerRequest(null)))
                .isInstanceOf(BusinessRuleException.class);
        assertThatThrownBy(() -> service.register(registerRequest("   ")))
                .isInstanceOf(BusinessRuleException.class);
        verify(userService, never()).register(any());
    }

    @Test
    void register_shortPassword_throwsBusinessRule() {
        assertThatThrownBy(() -> service.register(registerRequest("corta")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("12");
        verify(userService, never()).register(any());
    }

    @Test
    void register_oversizedPassword_throwsBusinessRule() {
        // BCrypt sólo considera los primeros 72 bytes.
        String tooLong = "a".repeat(73);
        assertThatThrownBy(() -> service.register(registerRequest(tooLong)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("72");
        verify(userService, never()).register(any());
    }

    // ---------- login ----------

    @Test
    void login_nullRequest_throwsAuthenticationFailed() {
        assertThatThrownBy(() -> service.login(null))
                .isInstanceOf(AuthenticationFailedException.class);
    }

    @Test
    void login_missingCredentials_throwsAuthenticationFailed() {
        assertThatThrownBy(() -> service.login(new LoginRequest(" ", RAW_PASSWORD)))
                .isInstanceOf(AuthenticationFailedException.class);
        assertThatThrownBy(() -> service.login(new LoginRequest("andrea", "")))
                .isInstanceOf(AuthenticationFailedException.class);
        verify(authenticationManager, never()).authenticate(any());
    }

    // T-SEC-006
    @Test
    void login_invalidCredentials_throwsGenericAuthenticationFailed() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("bad credentials"));

        assertThatThrownBy(() -> service.login(new LoginRequest("andrea", "incorrecta")))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    void login_foreignPrincipalType_throwsAuthenticationFailed() {
        when(authenticationManager.authenticate(any()))
                .thenReturn(UsernamePasswordAuthenticationToken.authenticated("andrea", null, List.of()));

        assertThatThrownBy(() -> service.login(new LoginRequest("andrea", RAW_PASSWORD)))
                .isInstanceOf(AuthenticationFailedException.class);
        verify(jwtService, never()).generateAccessToken(any());
    }

    // T-SEC-005
    @Test
    void login_validCredentials_returnsBearerToken() {
        // ARRANGE
        UserPrincipal principal = principal(1L, Role.USER);
        when(authenticationManager.authenticate(any()))
                .thenReturn(UsernamePasswordAuthenticationToken.authenticated(
                        principal, null, principal.getAuthorities()));
        when(jwtService.generateAccessToken(principal)).thenReturn("token-firmado");
        when(jwtService.accessTokenTtlSeconds()).thenReturn(900L);

        // ACT
        AuthResponse response = service.login(new LoginRequest("andrea", RAW_PASSWORD));

        // ASSERT
        assertThat(response.accessToken()).isEqualTo("token-firmado");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(900L);
    }

    // ---------- currentUser ----------

    @Test
    void currentUser_returnsMinimalInformationWithoutSecrets() {
        when(authorizationService.currentPrincipal()).thenReturn(principal(1L, Role.STAFF));

        AuthenticatedUserResponse response = service.currentUser();

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.username()).isEqualTo("andrea");
        assertThat(response.email()).isEqualTo("andrea@email.com");
        assertThat(response.active()).isTrue();
        assertThat(response.roles()).containsExactly("STAFF");
    }
}

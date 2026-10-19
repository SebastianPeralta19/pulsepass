package com.pulsepass.service.impl;

import com.pulsepass.domain.User;
import com.pulsepass.domain.UserCredential;
import com.pulsepass.domain.UserRole;
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
import com.pulsepass.service.AuthService;
import com.pulsepass.service.AuthorizationService;
import com.pulsepass.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    /** Mínimo académico definido en el PRD. */
    static final int MIN_PASSWORD_LENGTH = 12;
    /** Límite de BCrypt tradicional: 72 bytes. */
    static final int MAX_PASSWORD_BYTES = 72;
    private static final String TOKEN_TYPE = "Bearer";

    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AuthorizationService authorizationService;
    private final Clock clock;

    public AuthServiceImpl(UserService userService,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager,
                           JwtService jwtService,
                           AuthorizationService authorizationService,
                           Clock clock) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.authorizationService = authorizationService;
        this.clock = clock;
    }

    /**
     * La creación del usuario y de su credencial/rol comparte la transacción
     * abierta aquí: si falla cualquiera de los pasos no queda una cuenta sin
     * credenciales.
     */
    @Override
    @Transactional
    public UserResponse register(RegisterUserRequest request) {
        validatePassword(request);

        UserResponse created = userService.register(request);

        User user = userRepository.findById(created.id())
                .orElseThrow(() -> new IllegalStateException("Registered user not found: " + created.id()));
        user.setCredential(new UserCredential(
                user,
                passwordEncoder.encode(request.password()),
                LocalDateTime.now(clock)));
        user.addRole(new UserRole(user, Role.USER));
        userRepository.save(user);

        return created;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        if (request == null || isBlank(request.identifier()) || isBlank(request.password())) {
            throw new AuthenticationFailedException("Credentials are required");
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            request.identifier().trim(), request.password()));
        } catch (AuthenticationException ex) {
            // No se revela si el usuario existe, ni el motivo exacto.
            log.warn("Login failed");
            throw new AuthenticationFailedException("Invalid credentials", ex);
        }

        if (!(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            log.warn("Login failed");
            throw new AuthenticationFailedException("Invalid credentials");
        }

        String accessToken = jwtService.generateAccessToken(principal);
        log.info("Login succeeded for user id {}", principal.getId());
        return new AuthResponse(accessToken, TOKEN_TYPE, jwtService.accessTokenTtlSeconds());
    }

    @Override
    public AuthenticatedUserResponse currentUser() {
        UserPrincipal principal = authorizationService.currentPrincipal();
        return new AuthenticatedUserResponse(
                principal.getId(),
                principal.getUsername(),
                principal.getEmail(),
                principal.isEnabled(),
                principal.getRoleNames());
    }

    private static void validatePassword(RegisterUserRequest request) {
        if (request == null || isBlank(request.password())) {
            throw new BusinessRuleException("Password is required.");
        }
        if (request.password().length() < MIN_PASSWORD_LENGTH) {
            throw new BusinessRuleException(
                    "Password must be at least " + MIN_PASSWORD_LENGTH + " characters long.");
        }
        if (request.password().getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw new BusinessRuleException(
                    "Password must not exceed " + MAX_PASSWORD_BYTES + " bytes.");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

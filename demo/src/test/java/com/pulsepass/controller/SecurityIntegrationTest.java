package com.pulsepass.controller;

import com.pulsepass.domain.User;
import com.pulsepass.dto.response.EventResponse;
import com.pulsepass.dto.response.TicketResponse;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.enums.EventCategory;
import com.pulsepass.enums.EventStatus;
import com.pulsepass.enums.Role;
import com.pulsepass.enums.TicketStatus;
import com.pulsepass.enums.TicketType;
import com.pulsepass.mapper.UserMapper;
import com.pulsepass.security.CustomUserDetailsService;
import com.pulsepass.security.JwtProperties;
import com.pulsepass.security.JwtService;
import com.pulsepass.security.RestAccessDeniedHandler;
import com.pulsepass.security.RestAuthenticationEntryPoint;
import com.pulsepass.security.SecurityMessages;
import com.pulsepass.security.UserPrincipal;
import com.pulsepass.service.ArtistService;
import com.pulsepass.service.AuthService;
import com.pulsepass.service.EventService;
import com.pulsepass.service.TicketService;
import com.pulsepass.service.UserService;
import com.pulsepass.service.VenueService;
import com.pulsepass.service.impl.AuthServiceImpl;
import com.pulsepass.service.impl.AuthorizationServiceImpl;
import com.pulsepass.service.impl.UserServiceImpl;
import com.pulsepass.config.ClockConfig;
import com.pulsepass.config.SecurityConfig;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Suite de aceptación de la capa de seguridad (T-SEC-001..020).
 *
 * <p>Ejercita la cadena completa de filtros con el {@code JwtService}, el
 * {@code AuthenticationManager} y el {@code AuthService} reales; sólo la
 * persistencia y los servicios de negocio ajenos a la seguridad son dobles.</p>
 */
@WebMvcTest(controllers = {AuthController.class, UserController.class, EventController.class,
        TicketController.class, VenueController.class, ArtistController.class})
@Import({SecurityConfig.class, JwtService.class, CustomUserDetailsService.class, ClockConfig.class,
        RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class,
        AuthServiceImpl.class, AuthorizationServiceImpl.class, UserServiceImpl.class})
class SecurityIntegrationTest extends SecuredControllerTestBase {

    private static final String LOGIN_PASSWORD = "clave-segura-123";

    private static final String VALID_EVENT_JSON = """
            {
              "eventCode": "CMF-2026",
              "name": "Caribbean Music Fest 2026",
              "description": "Festival",
              "category": "MUSIC",
              "eventDate": "2030-12-01T20:00:00",
              "minimumAge": 18,
              "venueCode": "VEN-SMR-01"
            }
            """;

    private static final String INVALID_EVENT_JSON = """
            {
              "eventCode": "",
              "name": ""
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtProperties jwtProperties;

    @Autowired
    private PasswordEncoder encoder;

    @MockitoBean
    private UserMapper userMapper;

    @MockitoBean
    private EventService eventService;

    @MockitoBean
    private TicketService ticketService;

    @MockitoBean
    private VenueService venueService;

    @MockitoBean
    private ArtistService artistService;

    // ---------- helpers ----------

    private User account(long id, String username, String rawPassword, boolean active, Role... roles) {
        User user = user(id, username, roles);
        user.setActive(active);
        user.setCredential(new com.pulsepass.domain.UserCredential(
                user, encoder.encode(rawPassword), LocalDateTime.now()));
        return user;
    }

    private static EventResponse sampleEvent(EventStatus status) {
        return new EventResponse(1L, "CMF-2026", "Caribbean Music Fest 2026", "Festival",
                EventCategory.MUSIC, status, LocalDateTime.of(2030, 12, 1, 20, 0), 18,
                "VEN-SMR-01", "Marina Convention Center", List.of());
    }

    private static TicketResponse sampleTicket(TicketStatus status) {
        return new TicketResponse(1L, "TCK-0001", TicketType.VIP, new BigDecimal("250000.00"), status,
                LocalDateTime.of(2026, 10, 11, 12, 0), "andrea@email.com", "CMF-2026",
                "Caribbean Music Fest 2026");
    }

    private String expiredToken(long userId) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuer(jwtProperties.issuer())
                .issuedAt(Date.from(Instant.now().minusSeconds(3600)))
                .expiration(Date.from(Instant.now().minusSeconds(60)))
                .id(UUID.randomUUID().toString())
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtProperties.secretBase64())),
                        Jwts.SIG.HS256)
                .compact();
    }

    private static String tamper(String token) {
        return token.substring(0, token.length() - 2) + (token.endsWith("AA") ? "BB" : "AA");
    }

    // ---------- rutas públicas ----------

    // T-SEC-001
    @Test
    void anonymousCanListPublishedEvents() throws Exception {
        when(eventService.findPublishedEvents()).thenReturn(List.of());

        mockMvc.perform(get("/api/events/published"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }

    @Test
    void anonymousCanListActiveVenuesAndArtists() throws Exception {
        when(venueService.findActiveVenues()).thenReturn(List.of());
        when(artistService.findActiveArtists()).thenReturn(List.of());

        mockMvc.perform(get("/api/venues/active")).andExpect(status().isOk());
        mockMvc.perform(get("/api/artists/active")).andExpect(status().isOk());
    }

    // ---------- denegar por defecto ----------

    // T-SEC-002 + T-SEC-019
    @Test
    void anonymousCannotCreateEventAndReceivesUniformError() throws Exception {
        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_EVENT_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value(SecurityMessages.UNAUTHORIZED_MESSAGE))
                .andExpect(jsonPath("$.details").isEmpty())
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(content().string(not(containsString("hash"))))
                .andExpect(content().string(not(containsString("password"))));

        verify(eventService, never()).create(any());
    }

    @Test
    void anonymousCannotAccessAuthenticatedEndpoints() throws Exception {
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/tickets/by-user").param("email", "a@b.com"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/users/by-email").param("email", "a@b.com"))
                .andExpect(status().isUnauthorized());
    }

    // ---------- autorización por rol ----------

    // T-SEC-003
    @Test
    void userCannotCreateEvent_serviceIsNeverInvoked() throws Exception {
        mockMvc.perform(post("/api/events")
                        .header("Authorization", bearer(user(1L, "andrea", Role.USER)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_EVENT_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value(SecurityMessages.FORBIDDEN_MESSAGE))
                .andExpect(jsonPath("$.trace").doesNotExist());

        verify(eventService, never()).create(any());
    }

    // T-SEC-004
    @Test
    void adminCanCreateEvent() throws Exception {
        when(eventService.create(any())).thenReturn(sampleEvent(EventStatus.DRAFT));

        mockMvc.perform(post("/api/events")
                        .header("Authorization", bearer(user(2L, "admin", Role.ADMIN)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_EVENT_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        verify(eventService).create(any());
    }

    // T-SEC-018
    @Test
    void authorizedButInvalidRequestFailsBeanValidationFirst() throws Exception {
        mockMvc.perform(post("/api/events")
                        .header("Authorization", bearer(user(2L, "admin", Role.ADMIN)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(INVALID_EVENT_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.eventCode").exists());

        verify(eventService, never()).create(any());
    }

    // T-SEC-014
    @Test
    void adminCanPublishEvent() throws Exception {
        when(eventService.publish("CMF-2026")).thenReturn(sampleEvent(EventStatus.PUBLISHED));

        mockMvc.perform(patch("/api/events/CMF-2026/publish")
                        .header("Authorization", bearer(user(2L, "admin", Role.ADMIN))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    // T-SEC-012
    @Test
    void userCannotMarkTicketAsUsed() throws Exception {
        mockMvc.perform(patch("/api/tickets/TCK-0001/use")
                        .header("Authorization", bearer(user(1L, "andrea", Role.USER))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(SecurityMessages.FORBIDDEN_MESSAGE));

        verify(ticketService, never()).markAsUsed(any());
    }

    // T-SEC-013
    @Test
    void staffCanMarkTicketAsUsed() throws Exception {
        when(ticketService.markAsUsed("TCK-0001")).thenReturn(sampleTicket(TicketStatus.USED));

        mockMvc.perform(patch("/api/tickets/TCK-0001/use")
                        .header("Authorization", bearer(user(3L, "staff", Role.STAFF))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("USED"));
    }

    // T-SEC-011
    @Test
    void userCanCancelOwnTicket() throws Exception {
        when(ticketService.cancel("TCK-0001")).thenReturn(sampleTicket(TicketStatus.CANCELLED));

        mockMvc.perform(patch("/api/tickets/TCK-0001/cancel")
                        .header("Authorization", bearer(user(1L, "andrea", Role.USER))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    // T-SEC-015
    @Test
    void userCannotReadAnotherUsersData() throws Exception {
        User other = user(99L, "otro", Role.USER);
        when(userRepository.findByEmailIgnoreCase("otro@email.com")).thenReturn(Optional.of(other));

        mockMvc.perform(get("/api/users/by-email")
                        .param("email", "otro@email.com")
                        .header("Authorization", bearer(user(1L, "andrea", Role.USER))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value(SecurityMessages.FORBIDDEN_MESSAGE))
                .andExpect(content().string(not(containsString("otro@email.com"))));

        verify(userMapper, never()).toResponse(any());
    }

    // T-SEC-015 (control positivo): el propio usuario sí puede ver sus datos.
    @Test
    void userCanReadOwnData() throws Exception {
        User andrea = user(1L, "andrea", Role.USER);
        when(userRepository.findByEmailIgnoreCase("andrea@email.com")).thenReturn(Optional.of(andrea));
        when(userMapper.toResponse(andrea)).thenReturn(new UserResponse(1L, "andrea", "andrea@email.com",
                true, "Andrea", "Gomez", null, "Santa Marta", LocalDate.of(2001, 5, 20)));

        mockMvc.perform(get("/api/users/by-email")
                        .param("email", "andrea@email.com")
                        .header("Authorization", bearer(andrea)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("andrea@email.com"));
    }

    // ---------- login ----------

    // T-SEC-005
    @Test
    void loginWithValidCredentialsReturnsBearerAndAllowsProtectedAccess() throws Exception {
        User andrea = account(1L, "andrea", LOGIN_PASSWORD, true, Role.USER);
        when(userRepository.findPrincipalByIdentifier("andrea")).thenReturn(Optional.of(andrea));
        when(userRepository.findPrincipalById(1L)).thenReturn(Optional.of(andrea));

        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"identifier":"andrea","password":"%s"}""".formatted(LOGIN_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.expiresIn").isNumber())
                .andReturn().getResponse().getContentAsString();

        String token = body.replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("andrea"))
                .andExpect(jsonPath("$.roles[0]").value("USER"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    // T-SEC-006 + T-SEC-019
    @Test
    void loginWithWrongPasswordReturnsGeneric401() throws Exception {
        User andrea = account(1L, "andrea", LOGIN_PASSWORD, true, Role.USER);
        when(userRepository.findPrincipalByIdentifier("andrea")).thenReturn(Optional.of(andrea));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"identifier":"andrea","password":"contrasena-incorrecta"}"""))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid credentials"))
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(content().string(not(containsString("hash"))))
                .andExpect(content().string(not(containsString("andrea"))));
    }

    // ---------- tokens inválidos ----------

    // T-SEC-007
    @Test
    void expiredTokenIsRejectedWith401() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + expiredToken(1L)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(SecurityMessages.UNAUTHORIZED_MESSAGE))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }

    // T-SEC-008
    @Test
    void tamperedTokenIsRejectedWithoutTouchingRepositories() throws Exception {
        String valid = jwtService.generateAccessToken(UserPrincipal.from(user(1L, "andrea", Role.USER)));

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + tamper(valid)))
                .andExpect(status().isUnauthorized());

        verify(userRepository, never()).findPrincipalById(1L);
    }

    // T-SEC-016
    @Test
    void validTokenForInactiveUserIsRejected() throws Exception {
        User disabled = account(1L, "andrea", LOGIN_PASSWORD, false, Role.USER);
        when(userRepository.findPrincipalById(1L)).thenReturn(Optional.of(disabled));
        String token = jwtService.generateAccessToken(UserPrincipal.from(disabled));

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }
}

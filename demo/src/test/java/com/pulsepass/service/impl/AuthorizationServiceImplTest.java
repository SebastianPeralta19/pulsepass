package com.pulsepass.service.impl;

import com.pulsepass.domain.Ticket;
import com.pulsepass.domain.User;
import com.pulsepass.enums.Role;
import com.pulsepass.enums.TicketStatus;
import com.pulsepass.enums.TicketType;
import com.pulsepass.security.UserPrincipal;
import com.pulsepass.service.AuthorizationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * FR-SEC-USR-02/03 y FR-SEC-TKT-01..06: la propiedad se decide comparando el
 * id persistente del principal, nunca un identificador enviado por el cliente.
 */
class AuthorizationServiceImplTest {

    private AuthorizationService authorizationService;

    @BeforeEach
    void setUp() {
        authorizationService = new AuthorizationServiceImpl();
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private static void authenticate(long id, Role... roles) {
        UserPrincipal principal = new UserPrincipal(id, "user" + id, "user" + id + "@email.com",
                "hash", true, List.of(roles));
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.getAuthorities()));
    }

    private static User owner(long id) {
        User user = new User("owner", "owner@email.com", true);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static Ticket ticketOf(Long ownerId) {
        return new Ticket("TKT-1", TicketType.VIP, new BigDecimal("10.00"), TicketStatus.PAID,
                LocalDateTime.now(), ownerId == null ? null : owner(ownerId), null);
    }

    // ---------- currentPrincipal ----------

    @Test
    void currentPrincipal_withoutAuthentication_throwsAccessDenied() {
        assertThatThrownBy(() -> authorizationService.currentPrincipal())
                .isInstanceOf(AccessDeniedException.class);
        assertThat(authorizationService.currentPrincipalIfPresent()).isEmpty();
        assertThat(authorizationService.hasAnyRole(Role.USER)).isFalse();
    }

    @Test
    void currentPrincipal_withAuthenticatedUserPrincipal_returnsIt() {
        authenticate(3L, Role.USER);

        assertThat(authorizationService.currentPrincipal().getId()).isEqualTo(3L);
        assertThat(authorizationService.currentPrincipalIfPresent()).isPresent();
    }

    @Test
    void currentPrincipalIfPresent_withUnauthenticatedToken_isEmpty() {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.unauthenticated("andrea", "secreto"));

        assertThat(authorizationService.currentPrincipalIfPresent()).isEmpty();
    }

    @Test
    void currentPrincipalIfPresent_withForeignPrincipalType_isEmpty() {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated("anonymousUser", null, List.of()));

        assertThat(authorizationService.currentPrincipalIfPresent()).isEmpty();
    }

    // ---------- roles ----------

    @Test
    void hasAnyRole_matchesAssignedRoles() {
        authenticate(1L, Role.STAFF);

        assertThat(authorizationService.hasAnyRole(Role.STAFF, Role.ADMIN)).isTrue();
        assertThat(authorizationService.hasAnyRole(Role.ADMIN)).isFalse();
    }

    @Test
    void requireAnyRole_throwsWhenRoleMissing() {
        authenticate(1L, Role.USER);

        assertThatCode(() -> authorizationService.requireAnyRole(Role.USER)).doesNotThrowAnyException();
        assertThatThrownBy(() -> authorizationService.requireAnyRole(Role.ADMIN))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ---------- requireSelfOrAdmin ----------

    @Test
    void requireSelfOrAdmin_allowsOwnerAndAdminAndDeniesOthers() {
        authenticate(10L, Role.USER);
        assertThatCode(() -> authorizationService.requireSelfOrAdmin(10L)).doesNotThrowAnyException();
        assertThatThrownBy(() -> authorizationService.requireSelfOrAdmin(11L))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> authorizationService.requireSelfOrAdmin(null))
                .isInstanceOf(AccessDeniedException.class);

        authenticate(10L, Role.ADMIN);
        assertThatCode(() -> authorizationService.requireSelfOrAdmin(99L)).doesNotThrowAnyException();
    }

    // ---------- tickets ----------

    // T-SEC-009
    @Test
    void requireTicketRead_allowsOwnerStaffAndAdmin() {
        authenticate(1L, Role.USER);
        assertThatCode(() -> authorizationService.requireTicketRead(ticketOf(1L))).doesNotThrowAnyException();

        authenticate(2L, Role.STAFF);
        assertThatCode(() -> authorizationService.requireTicketRead(ticketOf(1L))).doesNotThrowAnyException();

        authenticate(2L, Role.ADMIN);
        assertThatCode(() -> authorizationService.requireTicketRead(ticketOf(1L))).doesNotThrowAnyException();
    }

    @Test
    void requireTicketRead_deniesForeignUser() {
        authenticate(2L, Role.USER);

        assertThatThrownBy(() -> authorizationService.requireTicketRead(ticketOf(1L)))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void requireTicketCancellation_allowsOwnerAndAdminDeniesStaff() {
        authenticate(1L, Role.USER);
        assertThatCode(() -> authorizationService.requireTicketCancellation(ticketOf(1L)))
                .doesNotThrowAnyException();

        authenticate(1L, Role.ADMIN);
        assertThatCode(() -> authorizationService.requireTicketCancellation(ticketOf(1L)))
                .doesNotThrowAnyException();

        authenticate(2L, Role.STAFF);
        assertThatThrownBy(() -> authorizationService.requireTicketCancellation(ticketOf(1L)))
                .isInstanceOf(AccessDeniedException.class);
    }

    // T-SEC-010
    @Test
    void requirePurchaseFor_allowsSelfAndAdminDeniesOthers() {
        authenticate(5L, Role.USER);
        assertThatCode(() -> authorizationService.requirePurchaseFor(5L)).doesNotThrowAnyException();
        assertThatThrownBy(() -> authorizationService.requirePurchaseFor(6L))
                .isInstanceOf(AccessDeniedException.class);

        authenticate(5L, Role.ADMIN);
        assertThatCode(() -> authorizationService.requirePurchaseFor(6L)).doesNotThrowAnyException();
    }
}

package com.pulsepass.service.impl;

import com.pulsepass.domain.Ticket;
import com.pulsepass.enums.Role;
import com.pulsepass.security.SecurityMessages;
import com.pulsepass.security.UserPrincipal;
import com.pulsepass.service.AuthorizationService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthorizationServiceImpl implements AuthorizationService {

    @Override
    public UserPrincipal currentPrincipal() {
        return currentPrincipalIfPresent()
                .orElseThrow(() -> new AccessDeniedException(SecurityMessages.FORBIDDEN_MESSAGE));
    }

    @Override
    public Optional<UserPrincipal> currentPrincipalIfPresent() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        if (authentication.getPrincipal() instanceof UserPrincipal principal) {
            return Optional.of(principal);
        }
        return Optional.empty();
    }

    @Override
    public boolean hasAnyRole(Role... roles) {
        return currentPrincipalIfPresent()
                .map(principal -> principal.hasAnyRole(roles))
                .orElse(false);
    }

    @Override
    public void requireAnyRole(Role... roles) {
        if (!hasAnyRole(roles)) {
            throw denied();
        }
    }

    @Override
    public void requireSelfOrAdmin(Long resourceOwnerId) {
        UserPrincipal principal = currentPrincipal();
        if (!isOwner(principal, resourceOwnerId) && !principal.hasRole(Role.ADMIN)) {
            throw denied();
        }
    }

    @Override
    public void requireTicketRead(Ticket ticket) {
        UserPrincipal principal = currentPrincipal();
        Long ownerId = ticket.getUser() == null ? null : ticket.getUser().getId();
        if (!isOwner(principal, ownerId) && !principal.hasAnyRole(Role.STAFF, Role.ADMIN)) {
            throw denied();
        }
    }

    @Override
    public void requireTicketCancellation(Ticket ticket) {
        UserPrincipal principal = currentPrincipal();
        Long ownerId = ticket.getUser() == null ? null : ticket.getUser().getId();
        if (!isOwner(principal, ownerId) && !principal.hasRole(Role.ADMIN)) {
            throw denied();
        }
    }

    @Override
    public void requirePurchaseFor(Long targetUserId) {
        UserPrincipal principal = currentPrincipal();
        if (!isOwner(principal, targetUserId) && !principal.hasRole(Role.ADMIN)) {
            throw denied();
        }
    }

    private static boolean isOwner(UserPrincipal principal, Long ownerId) {
        return ownerId != null && ownerId.equals(principal.getId());
    }

    private static AccessDeniedException denied() {
        return new AccessDeniedException(SecurityMessages.FORBIDDEN_MESSAGE);
    }
}

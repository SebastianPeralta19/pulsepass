package com.pulsepass.security;

import com.pulsepass.domain.User;
import com.pulsepass.domain.UserCredential;
import com.pulsepass.domain.UserRole;
import com.pulsepass.enums.Role;
import com.pulsepass.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * FR-SEC-AUTH-004/009: la identidad se reconstruye desde la base de datos
 * (estado y roles vigentes), no desde los claims del token.
 */
@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    private CustomUserDetailsService service;

    @BeforeEach
    void setUp() {
        service = new CustomUserDetailsService(userRepository);
    }

    private static User user(long id, boolean active, boolean withCredential, Role... roles) {
        User user = new User("andrea", "andrea@email.com", active);
        ReflectionTestUtils.setField(user, "id", id);
        for (Role role : roles) {
            user.addRole(new UserRole(user, role));
        }
        if (withCredential) {
            user.setCredential(new UserCredential(user, "$2a$10$hash", LocalDateTime.now()));
        }
        return user;
    }

    private static List<String> authorities(UserPrincipal principal) {
        return principal.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
    }

    @Test
    void loadUserByUsername_existingUser_mapsIdentityAndRoles() {
        // ARRANGE
        User andrea = user(5L, true, true, Role.USER, Role.STAFF);
        when(userRepository.findPrincipalByIdentifier("andrea")).thenReturn(Optional.of(andrea));

        // ACT
        UserPrincipal principal = (UserPrincipal) service.loadUserByUsername("andrea");

        // ASSERT
        assertThat(principal.getId()).isEqualTo(5L);
        assertThat(principal.getUsername()).isEqualTo("andrea");
        assertThat(principal.getEmail()).isEqualTo("andrea@email.com");
        assertThat(principal.getPassword()).isEqualTo("$2a$10$hash");
        assertThat(principal.isEnabled()).isTrue();
        assertThat(authorities(principal)).containsExactlyInAnyOrder("ROLE_USER", "ROLE_STAFF");
    }

    @Test
    void loadUserByUsername_missingUser_throwsUsernameNotFound() {
        when(userRepository.findPrincipalByIdentifier("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername("ghost"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void loadUserByUsername_userWithoutCredential_cannotAuthenticate() {
        // ARRANGE: usuario legado creado antes de la fase 4.
        when(userRepository.findPrincipalByIdentifier("legacy"))
                .thenReturn(Optional.of(user(9L, true, false, Role.USER)));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.loadUserByUsername("legacy"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("credentials");
    }

    @Test
    void loadUserByUsername_inactiveUser_isDisabled() {
        when(userRepository.findPrincipalByIdentifier("andrea"))
                .thenReturn(Optional.of(user(3L, false, true, Role.USER)));

        UserPrincipal principal = (UserPrincipal) service.loadUserByUsername("andrea");

        assertThat(principal.isEnabled()).isFalse();
    }

    @Test
    void loadUserById_existingUser_returnsPrincipal() {
        when(userRepository.findPrincipalById(11L))
                .thenReturn(Optional.of(user(11L, true, true, Role.ADMIN)));

        UserPrincipal principal = service.loadUserById(11L);

        assertThat(principal.getId()).isEqualTo(11L);
        assertThat(principal.hasRole(Role.ADMIN)).isTrue();
    }

    @Test
    void loadUserById_missingUser_throwsUsernameNotFound() {
        when(userRepository.findPrincipalById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserById(99L))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}

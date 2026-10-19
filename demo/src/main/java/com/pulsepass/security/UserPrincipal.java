package com.pulsepass.security;

import com.pulsepass.domain.User;
import com.pulsepass.enums.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Principal construido exclusivamente desde la base de datos: id persistente,
 * estado vigente y roles actuales. Los claims del token nunca sustituyen esta
 * carga, de modo que un rol revocado deja de tener efecto en el siguiente
 * request.
 */
public class UserPrincipal implements UserDetails {

    private static final String ROLE_PREFIX = "ROLE_";

    private final Long id;
    private final String username;
    private final String email;
    private final String password;
    private final boolean enabled;
    private final Set<GrantedAuthority> authorities;
    private final List<Role> roles;

    public UserPrincipal(Long id, String username, String email, String password,
                         boolean enabled, Collection<Role> roles) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.enabled = enabled;
        this.roles = List.copyOf(new LinkedHashSet<>(roles));
        this.authorities = this.roles.stream()
                .map(role -> (GrantedAuthority) new SimpleGrantedAuthority(ROLE_PREFIX + role.name()))
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
    }

    public static UserPrincipal from(User user) {
        String hash = user.getCredential() == null ? null : user.getCredential().getPasswordHash();
        return new UserPrincipal(user.getId(), user.getUsername(), user.getEmail(), hash,
                user.isActive(), user.getRoleNames());
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public List<Role> getRoles() {
        return roles;
    }

    public List<String> getRoleNames() {
        return roles.stream().map(Role::name).toList();
    }

    public boolean hasRole(Role role) {
        return roles.contains(role);
    }

    public boolean hasAnyRole(Role... candidates) {
        return java.util.Arrays.stream(candidates).anyMatch(roles::contains);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}

package com.pulsepass.domain;

import com.pulsepass.enums.Role;
import jakarta.persistence.*;

/**
 * Rol asignado a un usuario (N:1 con User, clave compuesta user_id + role).
 * Los roles privilegiados no se otorgan desde el registro público.
 */
@Entity
@Table(name = "user_roles")
@IdClass(UserRoleId.class)
public class UserRole {

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 30)
    private Role role;

    protected UserRole() {
    }

    public UserRole(User user, Role role) {
        this.user = user;
        this.role = role;
    }

    public User getUser() {
        return user;
    }

    public Role getRole() {
        return role;
    }
}

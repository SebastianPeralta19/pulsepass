package com.pulsepass.domain;

import java.io.Serializable;
import java.util.Objects;

import com.pulsepass.enums.Role;

/**
 * Clave compuesta (user_id, role) de UserRole.
 */
public class UserRoleId implements Serializable {

    private Long user;
    private Role role;

    public UserRoleId() {
    }

    public UserRoleId(Long user, Role role) {
        this.user = user;
        this.role = role;
    }

    public Long getUser() {
        return user;
    }

    public Role getRole() {
        return role;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof UserRoleId that)) {
            return false;
        }
        return Objects.equals(user, that.user) && role == that.role;
    }

    @Override
    public int hashCode() {
        return Objects.hash(user, role);
    }
}

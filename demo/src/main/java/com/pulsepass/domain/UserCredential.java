package com.pulsepass.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Credencial de autenticación, separada de la entidad de negocio User
 * (relación 1:1). Mantener el hash fuera de User evita que MapStruct o
 * cualquier serialización accidental lo exponga.
 */
@Entity
@Table(name = "user_credentials")
public class UserCredential {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    protected UserCredential() {
    }

    public UserCredential(User user, String passwordHash, LocalDateTime passwordChangedAt) {
        this.user = user;
        this.userId = user == null ? null : user.getId();
        this.passwordHash = passwordHash;
        this.passwordChangedAt = passwordChangedAt;
    }

    public Long getUserId() {
        return userId;
    }

    public User getUser() {
        return user;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public LocalDateTime getPasswordChangedAt() {
        return passwordChangedAt;
    }

    public void setPasswordChangedAt(LocalDateTime passwordChangedAt) {
        this.passwordChangedAt = passwordChangedAt;
    }
}

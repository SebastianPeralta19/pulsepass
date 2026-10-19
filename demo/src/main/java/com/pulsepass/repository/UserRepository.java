package com.pulsepass.repository;

import com.pulsepass.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByUsername(String username);

    boolean existsByEmailIgnoreCase(String email);

    /**
     * Carga la identidad de autenticación en una sola consulta, evitando N+1
     * al construir el principal (usuario + credencial + roles).
     */
    @Query("""
            SELECT DISTINCT u FROM User u
            LEFT JOIN FETCH u.credential
            LEFT JOIN FETCH u.roles
            WHERE LOWER(u.username) = LOWER(:identifier)
            OR LOWER(u.email) = LOWER(:identifier)
            """)
    Optional<User> findPrincipalByIdentifier(@Param("identifier") String identifier);

    @Query("""
            SELECT DISTINCT u FROM User u
            LEFT JOIN FETCH u.credential
            LEFT JOIN FETCH u.roles
            WHERE u.id = :id
            """)
    Optional<User> findPrincipalById(@Param("id") Long id);
}

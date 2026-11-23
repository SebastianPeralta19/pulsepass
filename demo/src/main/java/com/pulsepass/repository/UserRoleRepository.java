package com.pulsepass.repository;

import com.pulsepass.domain.UserRole;
import com.pulsepass.domain.UserRoleId;
import com.pulsepass.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {

    @Query("SELECT r FROM UserRole r WHERE r.user.id = :userId ORDER BY r.role ASC")
    List<UserRole> findByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) > 0 FROM UserRole r WHERE r.user.id = :userId AND r.role = :role")
    boolean existsByUserIdAndRole(@Param("userId") Long userId, @Param("role") Role role);
}

package com.pulsepass.repository;

import com.pulsepass.AbstractIntegrationTest;
import com.pulsepass.domain.User;
import com.pulsepass.domain.UserProfile;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserProfileImplTest extends AbstractIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private EntityManager entityManager;

    // UC-04 / QT-004: usuario con un unico perfil, datos recuperables via relacion
    @Test
    void shouldPersistUserWithSingleProfile() {
        User user = new User("andrea", "andrea@example.com", true);
        UserProfile profile = new UserProfile("Andrea", "Gomez", "3001234567", "Santa Marta",
                LocalDate.of(1998, 5, 20));
        user.setProfile(profile);

        userRepository.saveAndFlush(user);
        entityManager.clear();

        User reloaded = userRepository.findByUsername("andrea").orElseThrow();

        assertThat(reloaded.getProfile()).isNotNull();
        assertThat(reloaded.getProfile().getCity()).isEqualTo("Santa Marta");
    }

    // AC-004 / FR-USR-003: la FK del perfil es UNIQUE, no permite dos perfiles para el mismo usuario
    @Test
    void shouldRejectSecondProfileForSameUser() {
        User user = userRepository.saveAndFlush(new User("carlos", "carlos@example.com", true));

        UserProfile firstProfile = new UserProfile("Carlos", "Ruiz", "3009876543", "Barranquilla",
                LocalDate.of(1995, 3, 10));
        firstProfile.setUser(user);
        userProfileRepository.saveAndFlush(firstProfile);

        UserProfile secondProfile = new UserProfile("Carlos", "Ruiz", "3001112222", "Cartagena",
                LocalDate.of(1995, 3, 10));
        secondProfile.setUser(user);

        assertThatThrownBy(() -> userProfileRepository.saveAndFlush(secondProfile))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // FR-USR-002: username y email unicos
    @Test
    void shouldRejectDuplicateUsernameOrEmail() {
        userRepository.saveAndFlush(new User("laura", "laura@example.com", true));

        User duplicateUsername = new User("laura", "otro@example.com", true);
        assertThatThrownBy(() -> userRepository.saveAndFlush(duplicateUsername))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void shouldFindUserByEmailIgnoringCase() {
        userRepository.saveAndFlush(new User("miguel", "miguel@example.com", true));
        entityManager.clear();

        Optional<User> found = userRepository.findByEmailIgnoreCase("MIGUEL@EXAMPLE.COM");

        assertThat(found).isPresent();
    }
}
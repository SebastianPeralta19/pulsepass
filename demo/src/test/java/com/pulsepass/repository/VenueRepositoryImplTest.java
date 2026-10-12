package com.pulsepass.repository;

import com.pulsepass.AbstractIntegrationTest;
import com.pulsepass.domain.Venue;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VenueRepositoryImplTest extends AbstractIntegrationTest {

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private EntityManager entityManager;

    // AC-001
    @Test
    void shouldPersistAndRetrieveVenueByCode() {
        Venue venue = new Venue("VEN-SMR-01", "Marina Convention Center", "Santa Marta",
                "Av. del Libertador", 5000, true);

        venueRepository.saveAndFlush(venue);
        entityManager.clear();

        Optional<Venue> found = venueRepository.findByCode("VEN-SMR-01");

        assertThat(found).isPresent();
        assertThat(found.get().getCapacity()).isGreaterThan(0);
        assertThat(found.get().getCity()).isEqualTo("Santa Marta");
    }

    // FR-VEN-002 / QT-009: codigo unico
    @Test
    void shouldRejectDuplicateVenueCode() {
        venueRepository.saveAndFlush(
                new Venue("VEN-DUP-01", "Coliseo Norte", "Barranquilla", "Calle 45", 3000, true));

        Venue duplicate = new Venue("VEN-DUP-01", "Otro Recinto", "Cartagena", "Calle 10", 2000, true);

        assertThatThrownBy(() -> venueRepository.saveAndFlush(duplicate))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // FR-VEN-003: capacidad > 0 (constraint en PostgreSQL)
    @Test
    void shouldRejectVenueWithNonPositiveCapacity() {
        Venue invalid = new Venue("VEN-INV-01", "Recinto Invalido", "Santa Marta", "Calle 1", 0, true);

        assertThatThrownBy(() -> venueRepository.saveAndFlush(invalid))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
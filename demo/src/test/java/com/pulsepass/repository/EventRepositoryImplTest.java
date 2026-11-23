package com.pulsepass.repository;

import com.pulsepass.AbstractIntegrationTest;
import com.pulsepass.domain.Event;
import com.pulsepass.domain.Venue;
import com.pulsepass.enums.EventCategory;
import com.pulsepass.enums.EventStatus;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class EventRepositoryImplTest extends AbstractIntegrationTest {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private EntityManager entityManager;

    // AC-002
    @Test
    void shouldRetrieveEventWithVenueByEventCode() {
        Venue venue = venueRepository.saveAndFlush(
                new Venue("VEN-SMR-01", "Marina Convention Center", "Santa Marta", "Av. Libertador", 5000, true));

        Event event = new Event("CMF-2026", "Caribbean Music Fest 2026", "Festival de musica",
                EventCategory.MUSIC, EventStatus.PUBLISHED, LocalDateTime.now().plusMonths(2), 0, venue);
        eventRepository.saveAndFlush(event);
        entityManager.clear();

        Optional<Event> found = eventRepository.findByEventCode("CMF-2026");

        assertThat(found).isPresent();
        assertThat(found.get().getVenue().getCode()).isEqualTo("VEN-SMR-01");
    }

    // FR-EVT-005 / AC-006: eventos publicados ordenados por fecha ascendente
    @Test
    void shouldReturnOnlyPublishedEventsOrderedByDate() {
        Venue venue = venueRepository.saveAndFlush(
                new Venue("VEN-01", "Recinto", "Santa Marta", "Calle 1", 1000, true));

        Event draft = new Event("EVT-DRAFT", "Evento Borrador", "desc", EventCategory.MUSIC,
                EventStatus.DRAFT, LocalDateTime.now().plusDays(10), 0, venue);
        Event cancelled = new Event("EVT-CANC", "Evento Cancelado", "desc", EventCategory.MUSIC,
                EventStatus.CANCELLED, LocalDateTime.now().plusDays(5), 0, venue);
        Event publishedLater = new Event("EVT-PUB-2", "Publicado Tarde", "desc", EventCategory.MUSIC,
                EventStatus.PUBLISHED, LocalDateTime.now().plusDays(20), 0, venue);
        Event publishedEarlier = new Event("EVT-PUB-1", "Publicado Temprano", "desc", EventCategory.MUSIC,
                EventStatus.PUBLISHED, LocalDateTime.now().plusDays(3), 0, venue);

        eventRepository.saveAll(List.of(draft, cancelled, publishedLater, publishedEarlier));
        entityManager.flush();
        entityManager.clear();

        List<Event> published = eventRepository.findByStatusOrderByEventDateAsc(EventStatus.PUBLISHED);

        assertThat(published).extracting(Event::getEventCode)
                .containsExactly("EVT-PUB-1", "EVT-PUB-2");
    }

    // FR-VEN-004 / QT-007: eventos de un venue navegando la relacion por codigo de negocio
    @Test
    void shouldReturnEventsForGivenVenueCode() {
        Venue venueA = venueRepository.saveAndFlush(
                new Venue("VEN-A", "Recinto A", "Santa Marta", "Calle A", 1000, true));
        Venue venueB = venueRepository.saveAndFlush(
                new Venue("VEN-B", "Recinto B", "Barranquilla", "Calle B", 1000, true));

        eventRepository.saveAll(List.of(
                new Event("EVT-A1", "Evento A1", "desc", EventCategory.MUSIC, EventStatus.PUBLISHED,
                        LocalDateTime.now().plusDays(1), 0, venueA),
                new Event("EVT-B1", "Evento B1", "desc", EventCategory.SPORTS, EventStatus.PUBLISHED,
                        LocalDateTime.now().plusDays(1), 0, venueB)
        ));
        entityManager.flush();
        entityManager.clear();

        List<Event> eventsOfA = eventRepository.findByVenueCode("VEN-A");

        assertThat(eventsOfA).extracting(Event::getEventCode).containsExactly("EVT-A1");
    }
}
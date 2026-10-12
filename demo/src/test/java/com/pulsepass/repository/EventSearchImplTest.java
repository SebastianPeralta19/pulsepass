package com.pulsepass.repository;

import com.pulsepass.AbstractIntegrationTest;
import com.pulsepass.domain.Artist;
import com.pulsepass.domain.Event;
import com.pulsepass.domain.Venue;
import com.pulsepass.enums.EventCategory;
import com.pulsepass.enums.EventStatus;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EventSearchImplTest extends AbstractIntegrationTest {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private ArtistRepository artistRepository;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private EntityManager entityManager;

    // FR-SRC-002 / QT-008: eventos de una ciudad en los que participa un artista especifico
    @Test
    void shouldFindEventsByCityAndArtist() {
        Venue santaMarta = venueRepository.saveAndFlush(
                new Venue("VEN-SM", "Recinto SM", "Santa Marta", "Calle 1", 1000, true));
        Venue barranquilla = venueRepository.saveAndFlush(
                new Venue("VEN-BQ", "Recinto BQ", "Barranquilla", "Calle 2", 1000, true));
        Artist artist = artistRepository.findByStageName("Solar Beat").orElseThrow();

        Event inSantaMarta = new Event("EVT-SM-01", "Evento SM", "desc", EventCategory.MUSIC,
                EventStatus.PUBLISHED, LocalDateTime.now().plusDays(10), 0, santaMarta);
        inSantaMarta.addArtist(artist);
        Event inBarranquilla = new Event("EVT-BQ-01", "Evento BQ", "desc", EventCategory.MUSIC,
                EventStatus.PUBLISHED, LocalDateTime.now().plusDays(12), 0, barranquilla);
        inBarranquilla.addArtist(artist);

        eventRepository.saveAll(List.of(inSantaMarta, inBarranquilla));
        entityManager.flush();
        entityManager.clear();

        List<Event> results = eventRepository.findByVenueCityAndArtistStageName("Santa Marta", "Solar Beat");

        assertThat(results).extracting(Event::getEventCode).containsExactly("EVT-SM-01");
    }

    // FR-SRC-003 / AC-007: eventos recomendados, case-insensitive, DISTINCT, ordenados por fecha
    @Test
    void shouldFindRecommendedEventsCaseInsensitiveAndDistinct() {
        Venue venue = venueRepository.saveAndFlush(
                new Venue("VEN-REC", "Recinto Rec", "Santa Marta", "Calle 3", 1000, true));
        Artist solarBeat = artistRepository.findByStageName("Solar Beat").orElseThrow();
        Artist neonWaves = artistRepository.findByStageName("Neon Waves").orElseThrow();

        LocalDateTime referenceDate = LocalDateTime.now();

        Event laterEvent = new Event("EVT-REC-2", "Evento Recomendado 2", "desc", EventCategory.MUSIC,
                EventStatus.PUBLISHED, referenceDate.plusDays(20), 0, venue);
        laterEvent.addArtist(solarBeat);
        laterEvent.addArtist(neonWaves);

        Event earlierEvent = new Event("EVT-REC-1", "Evento Recomendado 1", "desc", EventCategory.MUSIC,
                EventStatus.PUBLISHED, referenceDate.plusDays(5), 0, venue);
        earlierEvent.addArtist(solarBeat);

        Event pastEvent = new Event("EVT-PAST", "Evento Pasado", "desc", EventCategory.MUSIC,
                EventStatus.PUBLISHED, referenceDate.minusDays(5), 0, venue);
        pastEvent.addArtist(solarBeat);

        eventRepository.saveAll(List.of(laterEvent, earlierEvent, pastEvent));
        entityManager.flush();
        entityManager.clear();

        List<Event> recommended = eventRepository.findRecommendedEvents(
                referenceDate, "Santa Marta", "solar");

        assertThat(recommended).extracting(Event::getEventCode)
                .containsExactly("EVT-REC-1", "EVT-REC-2");
    }

    // AC-006: solo se retornan eventos PUBLISHED, ni DRAFT ni CANCELLED
    @Test
    void shouldExcludeDraftAndCancelledFromPublishedQuery() {
        Venue venue = venueRepository.saveAndFlush(
                new Venue("VEN-STATUS", "Recinto Status", "Santa Marta", "Calle 4", 1000, true));

        eventRepository.saveAll(List.of(
                new Event("EVT-DRAFT-1", "Draft", "desc", EventCategory.MUSIC,
                        EventStatus.DRAFT, LocalDateTime.now().plusDays(1), 0, venue),
                new Event("EVT-CANC-1", "Cancelado", "desc", EventCategory.MUSIC,
                        EventStatus.CANCELLED, LocalDateTime.now().plusDays(2), 0, venue),
                new Event("EVT-PUB-1", "Publicado", "desc", EventCategory.MUSIC,
                        EventStatus.PUBLISHED, LocalDateTime.now().plusDays(3), 0, venue)
        ));
        entityManager.flush();
        entityManager.clear();

        List<Event> published = eventRepository.findByStatusOrderByEventDateAsc(EventStatus.PUBLISHED);

        assertThat(published).extracting(Event::getEventCode).containsExactly("EVT-PUB-1");
    }
}
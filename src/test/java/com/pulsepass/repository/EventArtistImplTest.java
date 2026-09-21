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

class EventArtistImplTest extends AbstractIntegrationTest {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private ArtistRepository artistRepository;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private EntityManager entityManager;

    // AC-003 / QT-005: evento con tres artistas, sin duplicar el par evento-artista
    @Test
    void shouldAssociateMultipleArtistsWithoutDuplicating() {
        Venue venue = venueRepository.saveAndFlush(
                new Venue("VEN-01", "Recinto", "Santa Marta", "Calle 1", 1000, true));

        Artist solarBeat = artistRepository.findByStageName("Solar Beat").orElseThrow();
        Artist neonWaves = artistRepository.findByStageName("Neon Waves").orElseThrow();
        Artist caribbeanSound = artistRepository.findByStageName("Caribbean Sound").orElseThrow();

        Event event = new Event("CMF-2026", "Caribbean Music Fest 2026", "desc", EventCategory.MUSIC,
                EventStatus.PUBLISHED, LocalDateTime.now().plusMonths(1), 0, venue);
        event.addArtist(solarBeat);
        event.addArtist(neonWaves);
        event.addArtist(caribbeanSound);

        eventRepository.saveAndFlush(event);
        entityManager.clear();

        Event reloaded = eventRepository.findByEventCode("CMF-2026").orElseThrow();

        assertThat(reloaded.getArtists()).hasSize(3);
        assertThat(reloaded.getArtists()).extracting(Artist::getStageName)
                .containsExactlyInAnyOrder("Solar Beat", "Neon Waves", "Caribbean Sound");
    }

    // FR-ART-003 / FR-ART-004: no se duplica el mismo par evento-artista aunque se agregue dos veces
    @Test
    void shouldNotDuplicateSameEventArtistPair() {
        Venue venue = venueRepository.saveAndFlush(
                new Venue("VEN-02", "Recinto 2", "Santa Marta", "Calle 2", 500, true));
        Artist artist = artistRepository.findByStageName("Digital Pulse").orElseThrow();

        Event event = new Event("EVT-DP-01", "Noche Techno", "desc", EventCategory.MUSIC,
                EventStatus.PUBLISHED, LocalDateTime.now().plusDays(15), 0, venue);
        event.addArtist(artist);
        event.addArtist(artist);

        eventRepository.saveAndFlush(event);
        entityManager.clear();

        Event reloaded = eventRepository.findByEventCode("EVT-DP-01").orElseThrow();

        assertThat(reloaded.getArtists()).hasSize(1);
    }

    // FR-ART-004: eventos de un artista via JPQL
    @Test
    void shouldFindEventsByArtistStageName() {
        Venue venue = venueRepository.saveAndFlush(
                new Venue("VEN-03", "Recinto 3", "Cartagena", "Calle 3", 800, true));
        Artist artist = artistRepository.findByStageName("Ocean Drive").orElseThrow();

        Event eventOne = new Event("EVT-OD-01", "Evento Uno", "desc", EventCategory.MUSIC,
                EventStatus.PUBLISHED, LocalDateTime.now().plusDays(5), 0, venue);
        eventOne.addArtist(artist);
        Event eventTwo = new Event("EVT-OD-02", "Evento Dos", "desc", EventCategory.MUSIC,
                EventStatus.PUBLISHED, LocalDateTime.now().plusDays(9), 0, venue);
        eventTwo.addArtist(artist);

        eventRepository.saveAll(List.of(eventOne, eventTwo));
        entityManager.flush();
        entityManager.clear();

        List<Event> events = eventRepository.findByArtistStageName("Ocean Drive");

        assertThat(events).extracting(Event::getEventCode)
                .containsExactlyInAnyOrder("EVT-OD-01", "EVT-OD-02");
    }
}
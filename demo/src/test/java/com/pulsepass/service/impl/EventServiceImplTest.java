package com.pulsepass.service.impl;

import com.pulsepass.domain.Artist;
import com.pulsepass.domain.Event;
import com.pulsepass.domain.Venue;
import com.pulsepass.dto.request.CreateEventRequest;
import com.pulsepass.dto.response.EventResponse;
import com.pulsepass.dto.response.EventSummaryResponse;
import com.pulsepass.enums.EventCategory;
import com.pulsepass.enums.EventStatus;
import com.pulsepass.enums.Role;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.EventMapper;
import com.pulsepass.repository.ArtistRepository;
import com.pulsepass.repository.EventRepository;
import com.pulsepass.repository.VenueRepository;
import com.pulsepass.service.AuthorizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    // "Hoy" fijo para que los tests no dependan de la fecha real
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-05T10:00:00Z"), ZoneOffset.UTC);
    private static final LocalDateTime FUTURE = LocalDateTime.of(2026, 12, 12, 20, 0);
    private static final LocalDateTime PAST = LocalDateTime.of(2026, 1, 1, 20, 0);

    @Mock
    private EventRepository eventRepository;
    @Mock
    private VenueRepository venueRepository;
    @Mock
    private ArtistRepository artistRepository;
    @Mock
    private EventMapper eventMapper;
    @Mock
    private AuthorizationService authorizationService;

    private EventServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new EventServiceImpl(eventRepository, venueRepository, artistRepository, eventMapper,
                authorizationService, CLOCK);
    }

    // ---------- fixtures ----------

    private static Venue venue(boolean active) {
        return new Venue("VEN-SMR-01", "Marina Convention Center", "Santa Marta", "Calle 1", 3, active);
    }

    private static Event event(EventStatus status, LocalDateTime date, Venue venue) {
        return new Event("CMF-2026", "Caribbean Music Fest 2026", "Festival", EventCategory.MUSIC,
                status, date, 18, venue);
    }

    private static Artist artist(Long id, String name) {
        Artist artist = new Artist(name, "Colombia", "Electronic", true);
        ReflectionTestUtils.setField(artist, "id", id);
        return artist;
    }

    private static CreateEventRequest request(LocalDateTime date, Integer minimumAge) {
        return new CreateEventRequest("CMF-2026", "Caribbean Music Fest 2026", "Festival",
                EventCategory.MUSIC, date, minimumAge, "VEN-SMR-01");
    }

    private static EventResponse responseOf(Event e) {
        return new EventResponse(e.getId(), e.getEventCode(), e.getName(), e.getDescription(),
                e.getCategory(), e.getStatus(), e.getEventDate(), e.getMinimumAge(),
                e.getVenue().getCode(), e.getVenue().getName(), List.of());
    }

    private void stubMapper() {
        when(eventMapper.toResponse(any(Event.class))).thenAnswer(inv -> responseOf(inv.getArgument(0)));
    }

    // ---------- findByCode ----------

    @Test
    void findByCode_existingEvent_returnsDto() {
        // ARRANGE
        Event event = event(EventStatus.DRAFT, FUTURE, venue(true));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(authorizationService.hasAnyRole(Role.STAFF, Role.ADMIN)).thenReturn(true);
        stubMapper();

        // ACT
        EventResponse result = service.findByCode("CMF-2026");

        // ASSERT
        assertThat(result.eventCode()).isEqualTo("CMF-2026");
        assertThat(result.venueName()).isEqualTo("Marina Convention Center");
    }

    // FR-SEC-EVT-02 / T-SEC-017: un anónimo no debe poder ver un borrador.
    @Test
    void findByCode_draftEventWithoutPrivileges_isHiddenAsNotFound() {
        // ARRANGE
        Event event = event(EventStatus.DRAFT, FUTURE, venue(true));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(authorizationService.hasAnyRole(Role.STAFF, Role.ADMIN)).thenReturn(false);

        // ACT + ASSERT
        assertThatThrownBy(() -> service.findByCode("CMF-2026"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("CMF-2026");
    }

    @Test
    void findByCode_publishedEventIsVisibleWithoutPrivileges() {
        // ARRANGE
        Event event = event(EventStatus.PUBLISHED, FUTURE, venue(true));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        stubMapper();

        // ACT
        EventResponse result = service.findByCode("CMF-2026");

        // ASSERT
        assertThat(result.status()).isEqualTo(EventStatus.PUBLISHED);
    }

    @Test
    void findByCode_missingEvent_throwsNotFound() {
        // ARRANGE
        when(eventRepository.findByEventCode("NOPE")).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.findByCode("NOPE"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("NOPE");
    }

    // ---------- create ----------

    @Test
    void create_validRequest_savesEventAsDraft() {
        // ARRANGE
        when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue(true)));
        when(eventRepository.save(any(Event.class))).then(returnsFirstArg());
        stubMapper();

        // ACT
        EventResponse result = service.create(request(FUTURE, 18));

        // ASSERT
        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(EventStatus.DRAFT);
        assertThat(captor.getValue().getVenue().getCode()).isEqualTo("VEN-SMR-01");
        assertThat(result.status()).isEqualTo(EventStatus.DRAFT);
    }

    @Test
    void create_duplicatedEventCode_throwsDuplicate() {
        // ARRANGE
        when(eventRepository.existsByEventCode("CMF-2026")).thenReturn(true);

        // ACT + ASSERT
        assertThatThrownBy(() -> service.create(request(FUTURE, 18)))
                .isInstanceOf(DuplicateResourceException.class);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void create_missingVenue_throwsNotFoundAndNeverSaves() {
        // ARRANGE
        when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.create(request(FUTURE, 18)))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void create_inactiveVenue_throwsBusinessRule() {
        // ARRANGE
        when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue(false)));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.create(request(FUTURE, 18)))
                .isInstanceOf(BusinessRuleException.class);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void create_pastDate_throwsBusinessRule() {
        // ARRANGE
        when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue(true)));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.create(request(PAST, 18)))
                .isInstanceOf(BusinessRuleException.class);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void create_negativeMinimumAge_throwsBusinessRule() {
        // ACT + ASSERT
        assertThatThrownBy(() -> service.create(request(FUTURE, -1)))
                .isInstanceOf(BusinessRuleException.class);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void create_zeroMinimumAge_isAllowed() {
        // ARRANGE
        when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue(true)));
        when(eventRepository.save(any(Event.class))).then(returnsFirstArg());
        stubMapper();

        // ACT
        EventResponse result = service.create(request(FUTURE, 0));

        // ASSERT
        assertThat(result.minimumAge()).isZero();
    }

    // ---------- publish ----------

    @Test
    void publish_validDraft_becomesPublished() {
        // ARRANGE
        Event event = event(EventStatus.DRAFT, FUTURE, venue(true));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(eventRepository.save(any(Event.class))).then(returnsFirstArg());
        stubMapper();

        // ACT
        EventResponse result = service.publish("CMF-2026");

        // ASSERT
        assertThat(result.status()).isEqualTo(EventStatus.PUBLISHED);
        verify(eventRepository).save(event);
    }

    @Test
    void publish_cancelledEvent_throwsBusinessRuleAndNeverSaves() {
        // ARRANGE
        Event event = event(EventStatus.CANCELLED, FUTURE, venue(true));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.publish("CMF-2026"))
                .isInstanceOf(BusinessRuleException.class);
        assertThat(event.getStatus()).isEqualTo(EventStatus.CANCELLED);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void publish_alreadyPublished_throwsBusinessRule() {
        // ARRANGE
        when(eventRepository.findByEventCode("CMF-2026"))
                .thenReturn(Optional.of(event(EventStatus.PUBLISHED, FUTURE, venue(true))));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.publish("CMF-2026"))
                .isInstanceOf(BusinessRuleException.class);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void publish_pastDate_throwsBusinessRule() {
        // ARRANGE
        when(eventRepository.findByEventCode("CMF-2026"))
                .thenReturn(Optional.of(event(EventStatus.DRAFT, PAST, venue(true))));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.publish("CMF-2026"))
                .isInstanceOf(BusinessRuleException.class);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void publish_inactiveVenue_throwsBusinessRule() {
        // ARRANGE
        when(eventRepository.findByEventCode("CMF-2026"))
                .thenReturn(Optional.of(event(EventStatus.DRAFT, FUTURE, venue(false))));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.publish("CMF-2026"))
                .isInstanceOf(BusinessRuleException.class);
        verify(eventRepository, never()).save(any());
    }

    // ---------- addArtist ----------

    @Test
    void addArtist_validArtist_associatesAndSaves() {
        // ARRANGE
        Event event = event(EventStatus.DRAFT, FUTURE, venue(true));
        Artist solarBeat = artist(10L, "Solar Beat");
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(artistRepository.findById(10L)).thenReturn(Optional.of(solarBeat));
        when(eventRepository.save(any(Event.class))).then(returnsFirstArg());
        stubMapper();

        // ACT
        service.addArtist("CMF-2026", 10L);

        // ASSERT
        assertThat(event.getArtists()).containsExactly(solarBeat);
        verify(eventRepository).save(event);
    }

    @Test
    void addArtist_sameArtistTwice_throwsDuplicate() {
        // ARRANGE
        Event event = event(EventStatus.DRAFT, FUTURE, venue(true));
        Artist solarBeat = artist(10L, "Solar Beat");
        event.addArtist(solarBeat);
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(artistRepository.findById(10L)).thenReturn(Optional.of(solarBeat));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.addArtist("CMF-2026", 10L))
                .isInstanceOf(DuplicateResourceException.class);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void addArtist_cancelledEvent_throwsBusinessRule() {
        // ARRANGE
        Event event = event(EventStatus.CANCELLED, FUTURE, venue(true));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(artistRepository.findById(10L)).thenReturn(Optional.of(artist(10L, "Solar Beat")));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.addArtist("CMF-2026", 10L))
                .isInstanceOf(BusinessRuleException.class);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void addArtist_finishedEvent_throwsBusinessRule() {
        // ARRANGE
        Event event = event(EventStatus.FINISHED, PAST, venue(true));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(artistRepository.findById(10L)).thenReturn(Optional.of(artist(10L, "Solar Beat")));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.addArtist("CMF-2026", 10L))
                .isInstanceOf(BusinessRuleException.class);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void addArtist_missingEvent_throwsNotFound() {
        // ARRANGE
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.addArtist("CMF-2026", 10L))
                .isInstanceOf(ResourceNotFoundException.class);
        verifyNoInteractions(artistRepository);
    }

    @Test
    void addArtist_missingArtist_throwsNotFound() {
        // ARRANGE
        when(eventRepository.findByEventCode("CMF-2026"))
                .thenReturn(Optional.of(event(EventStatus.DRAFT, FUTURE, venue(true))));
        when(artistRepository.findById(10L)).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.addArtist("CMF-2026", 10L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(eventRepository, never()).save(any());
    }

    // ---------- listados ----------

    @Test
    void findPublishedEvents_mapsEveryPublishedEvent() {
        // ARRANGE
        Event event = event(EventStatus.PUBLISHED, FUTURE, venue(true));
        EventSummaryResponse summary = new EventSummaryResponse(1L, "CMF-2026", "Caribbean Music Fest 2026",
                EventCategory.MUSIC, EventStatus.PUBLISHED, FUTURE, "VEN-SMR-01", "Marina Convention Center");
        when(eventRepository.findByStatusOrderByEventDateAsc(EventStatus.PUBLISHED)).thenReturn(List.of(event));
        when(eventMapper.toSummary(event)).thenReturn(summary);

        // ACT
        List<EventSummaryResponse> result = service.findPublishedEvents();

        // ASSERT
        assertThat(result).containsExactly(summary);
    }

    @Test
    void findByArtist_returnsSummariesOfThatArtist() {
        // ARRANGE
        Event event = event(EventStatus.PUBLISHED, FUTURE, venue(true));
        EventSummaryResponse summary = new EventSummaryResponse(1L, "CMF-2026", "Caribbean Music Fest 2026",
                EventCategory.MUSIC, EventStatus.PUBLISHED, FUTURE, "VEN-SMR-01", "Marina Convention Center");
        when(eventRepository.findByArtistStageName("Solar Beat")).thenReturn(List.of(event));
        when(eventMapper.toSummary(event)).thenReturn(summary);

        // ACT
        List<EventSummaryResponse> result = service.findByArtist("Solar Beat");

        // ASSERT
        assertThat(result).hasSize(1);
        verify(eventRepository).findByArtistStageName("Solar Beat");
    }

    // FR-SEC-EVT-06: la ruta pública sólo expone eventos publicados.
    @Test
    void findByArtist_hidesDraftEventsFromAnonymous() {
        // ARRANGE
        Event draft = event(EventStatus.DRAFT, FUTURE, venue(true));
        Event published = event(EventStatus.PUBLISHED, FUTURE, venue(true));
        when(eventRepository.findByArtistStageName("Solar Beat")).thenReturn(List.of(draft, published));
        when(authorizationService.hasAnyRole(Role.STAFF, Role.ADMIN)).thenReturn(false);
        EventSummaryResponse summary = new EventSummaryResponse(1L, "CMF-2026", "Caribbean Music Fest 2026",
                EventCategory.MUSIC, EventStatus.PUBLISHED, FUTURE, "VEN-SMR-01", "Marina Convention Center");
        when(eventMapper.toSummary(published)).thenReturn(summary);

        // ACT
        List<EventSummaryResponse> result = service.findByArtist("Solar Beat");

        // ASSERT
        assertThat(result).containsExactly(summary);
    }

    @Test
    void findByArtist_showsDraftEventsToPrivilegedRoles() {
        // ARRANGE
        Event draft = event(EventStatus.DRAFT, FUTURE, venue(true));
        when(eventRepository.findByArtistStageName("Solar Beat")).thenReturn(List.of(draft));
        when(authorizationService.hasAnyRole(Role.STAFF, Role.ADMIN)).thenReturn(true);
        EventSummaryResponse summary = new EventSummaryResponse(1L, "CMF-2026", "Caribbean Music Fest 2026",
                EventCategory.MUSIC, EventStatus.DRAFT, FUTURE, "VEN-SMR-01", "Marina Convention Center");
        when(eventMapper.toSummary(draft)).thenReturn(summary);

        // ACT
        List<EventSummaryResponse> result = service.findByArtist("Solar Beat");

        // ASSERT
        assertThat(result).containsExactly(summary);
    }
}

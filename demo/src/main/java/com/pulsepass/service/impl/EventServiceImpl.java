package com.pulsepass.service.impl;

import com.pulsepass.domain.Artist;
import com.pulsepass.domain.Event;
import com.pulsepass.domain.Venue;
import com.pulsepass.dto.request.CreateEventRequest;
import com.pulsepass.dto.response.EventResponse;
import com.pulsepass.dto.response.EventSummaryResponse;
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
import com.pulsepass.service.EventService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final ArtistRepository artistRepository;
    private final EventMapper eventMapper;
    private final AuthorizationService authorizationService;
    private final Clock clock;

    public EventServiceImpl(EventRepository eventRepository,
                            VenueRepository venueRepository,
                            ArtistRepository artistRepository,
                            EventMapper eventMapper,
                            AuthorizationService authorizationService,
                            Clock clock) {
        this.eventRepository = eventRepository;
        this.venueRepository = venueRepository;
        this.artistRepository = artistRepository;
        this.eventMapper = eventMapper;
        this.authorizationService = authorizationService;
        this.clock = clock;
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public EventResponse create(CreateEventRequest request) {
        validateCreateRequest(request);

        if (eventRepository.existsByEventCode(request.eventCode())) {
            throw new DuplicateResourceException("Event already exists: " + request.eventCode());
        }

        Venue venue = venueRepository.findByCode(request.venueCode())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + request.venueCode()));

        if (!venue.isActive()) {
            throw new BusinessRuleException("Venue is not active: " + venue.getCode());
        }

        if (!isFuture(request.eventDate())) {
            throw new BusinessRuleException("Event date must be in the future.");
        }

        Event event = new Event(
                request.eventCode(),
                request.name(),
                request.description(),
                request.category(),
                EventStatus.DRAFT,
                request.eventDate(),
                request.minimumAge(),
                venue);

        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Override
    @Transactional(readOnly = true)
    public EventResponse findByCode(String eventCode) {
        Event event = getEvent(eventCode);
        if (event.getStatus() != EventStatus.PUBLISHED && !isPrivileged()) {
            // No se revela la existencia de borradores (FR-SEC-EVT-02).
            throw new ResourceNotFoundException("Event not found: " + eventCode);
        }
        return eventMapper.toResponse(event);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventSummaryResponse> findPublishedEvents() {
        return eventRepository.findByStatusOrderByEventDateAsc(EventStatus.PUBLISHED)
                .stream()
                .map(eventMapper::toSummary)
                .toList();
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public EventResponse publish(String eventCode) {
        Event event = getEvent(eventCode);

        if (event.getStatus() != EventStatus.DRAFT) {
            throw new BusinessRuleException(
                    "Only DRAFT events can be published. Current status: " + event.getStatus());
        }
        if (!isFuture(event.getEventDate())) {
            throw new BusinessRuleException("Event date must still be in the future to publish.");
        }
        if (!event.getVenue().isActive()) {
            throw new BusinessRuleException("Venue is not active: " + event.getVenue().getCode());
        }

        event.setStatus(EventStatus.PUBLISHED);
        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public EventResponse addArtist(String eventCode, Long artistId) {
        Event event = getEvent(eventCode);
        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + artistId));

        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.FINISHED) {
            throw new BusinessRuleException(
                    "Cannot add artists to an event with status " + event.getStatus());
        }

        boolean alreadyAssociated = event.getArtists().stream()
                .anyMatch(existing -> existing == artist
                        || (existing.getId() != null && existing.getId().equals(artist.getId())));
        if (alreadyAssociated) {
            throw new DuplicateResourceException(
                    "Artist " + artist.getStageName() + " is already associated with event " + eventCode);
        }

        event.addArtist(artist);
        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventSummaryResponse> findByArtist(String stageName) {
        boolean privileged = isPrivileged();
        return eventRepository.findByArtistStageName(stageName)
                .stream()
                // La ruta es pública: sólo se exponen eventos publicados salvo
                // para STAFF/ADMIN (FR-SEC-EVT-06).
                .filter(event -> privileged || event.getStatus() == EventStatus.PUBLISHED)
                .map(eventMapper::toSummary)
                .toList();
    }

    // ---------- helpers ----------

    private boolean isPrivileged() {
        return authorizationService.hasAnyRole(Role.STAFF, Role.ADMIN);
    }

    private Event getEvent(String eventCode) {
        return eventRepository.findByEventCode(eventCode)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventCode));
    }

    private boolean isFuture(LocalDateTime date) {
        return date != null && date.isAfter(LocalDateTime.now(clock));
    }

    private void validateCreateRequest(CreateEventRequest request) {
        if (request == null) {
            throw new BusinessRuleException("Request is required.");
        }
        if (isBlank(request.eventCode())) {
            throw new BusinessRuleException("Event code is required.");
        }
        if (isBlank(request.name())) {
            throw new BusinessRuleException("Event name is required.");
        }
        if (request.category() == null) {
            throw new BusinessRuleException("Event category is required.");
        }
        if (request.eventDate() == null) {
            throw new BusinessRuleException("Event date is required.");
        }
        if (isBlank(request.venueCode())) {
            throw new BusinessRuleException("Venue code is required.");
        }
        if (request.minimumAge() == null || request.minimumAge() < 0) {
            throw new BusinessRuleException("Minimum age must be zero or greater.");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

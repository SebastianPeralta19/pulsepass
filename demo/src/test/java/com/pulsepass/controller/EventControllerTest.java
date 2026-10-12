package com.pulsepass.controller;

import com.pulsepass.dto.request.CreateEventRequest;
import com.pulsepass.dto.response.ArtistResponse;
import com.pulsepass.dto.response.EventResponse;
import com.pulsepass.dto.response.EventSummaryResponse;
import com.pulsepass.enums.EventCategory;
import com.pulsepass.enums.EventStatus;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.service.EventService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EventController.class)
class EventControllerTest {

    private static final String VALID_EVENT_JSON = """
            {
              "eventCode": "CMF-2026",
              "name": "Caribbean Music Fest 2026",
              "description": "Festival de musica caribena",
              "category": "MUSIC",
              "eventDate": "2030-12-01T20:00:00",
              "minimumAge": 18,
              "venueCode": "VEN-SMR-01"
            }
            """;

    private static final String INVALID_EVENT_JSON = """
            {
              "eventCode": "",
              "name": "Caribbean Music Fest 2026",
              "category": "MUSIC",
              "eventDate": "2030-12-01T20:00:00",
              "minimumAge": 18
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EventService eventService;

    private EventResponse event(EventStatus status, List<ArtistResponse> artists) {
        return new EventResponse(1L, "CMF-2026", "Caribbean Music Fest 2026",
                "Festival de musica caribena", EventCategory.MUSIC, status,
                LocalDateTime.of(2030, 12, 1, 20, 0), 18,
                "VEN-SMR-01", "Marina Convention Center", artists);
    }

    private EventSummaryResponse summary() {
        return new EventSummaryResponse(1L, "CMF-2026", "Caribbean Music Fest 2026",
                EventCategory.MUSIC, EventStatus.PUBLISHED,
                LocalDateTime.of(2030, 12, 1, 20, 0),
                "VEN-SMR-01", "Marina Convention Center");
    }

    // TEST-CTRL-EVT-001 / AC-CTRL003
    @Test
    void shouldReturn201WhenEventIsCreated() throws Exception {
        when(eventService.create(any(CreateEventRequest.class)))
                .thenReturn(event(EventStatus.DRAFT, List.of()));

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_EVENT_JSON))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.eventCode").value("CMF-2026"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.venueCode").value("VEN-SMR-01"));

        verify(eventService).create(any(CreateEventRequest.class));
    }

    // TEST-CTRL-EVT-002 / AC-CTRL004
    @Test
    void shouldReturn400AndNotCallServiceWhenRequestIsInvalid() throws Exception {
        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(INVALID_EVENT_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.eventCode").value("Event code is required"))
                .andExpect(jsonPath("$.details.venueCode").value("Venue code is required"));

        verify(eventService, never()).create(any());
    }

    @Test
    void shouldReturn400WhenJsonIsMalformed() throws Exception {
        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ esto no es json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed JSON request"));

        verify(eventService, never()).create(any());
    }

    // TEST-CTRL-EVT-003
    @Test
    void shouldReturn200WhenEventExists() throws Exception {
        when(eventService.findByCode("CMF-2026")).thenReturn(event(EventStatus.DRAFT, List.of()));

        mockMvc.perform(get("/api/events/CMF-2026"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.eventCode").value("CMF-2026"))
                .andExpect(jsonPath("$.venueName").value("Marina Convention Center"));

        verify(eventService).findByCode("CMF-2026");
    }

    // TEST-CTRL-EVT-004
    @Test
    void shouldReturn404WhenEventDoesNotExist() throws Exception {
        when(eventService.findByCode("NOPE-1"))
                .thenThrow(new ResourceNotFoundException("Event not found: NOPE-1"));

        mockMvc.perform(get("/api/events/NOPE-1"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Event not found: NOPE-1"));

        verify(eventService).findByCode("NOPE-1");
    }

    // TEST-CTRL-EVT-005
    @Test
    void shouldReturn200WithPublishedEvents() throws Exception {
        when(eventService.findPublishedEvents()).thenReturn(List.of(summary()));

        mockMvc.perform(get("/api/events/published"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].eventCode").value("CMF-2026"))
                .andExpect(jsonPath("$[0].status").value("PUBLISHED"));

        verify(eventService).findPublishedEvents();
    }

    // TEST-CTRL-EVT-006 / AC-CTRL005
    @Test
    void shouldReturn200WhenEventIsPublished() throws Exception {
        when(eventService.publish("CMF-2026")).thenReturn(event(EventStatus.PUBLISHED, List.of()));

        mockMvc.perform(patch("/api/events/CMF-2026/publish"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        verify(eventService).publish("CMF-2026");
    }

    // TEST-CTRL-EVT-007 / AC-CTRL006
    @Test
    void shouldReturn409WhenPublishViolatesBusinessRule() throws Exception {
        when(eventService.publish("CMF-2026"))
                .thenThrow(new BusinessRuleException("Only DRAFT events can be published."));

        mockMvc.perform(patch("/api/events/CMF-2026/publish"))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Only DRAFT events can be published."));

        verify(eventService).publish("CMF-2026");
    }

    // TEST-CTRL-EVT-008
    @Test
    void shouldReturn200WhenArtistIsAddedToEvent() throws Exception {
        ArtistResponse solarBeat = new ArtistResponse(1L, "Solar Beat", "Colombia", "Electronic", true);
        when(eventService.addArtist("CMF-2026", 1L))
                .thenReturn(event(EventStatus.DRAFT, List.of(solarBeat)));

        mockMvc.perform(post("/api/events/CMF-2026/artists/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.artists.length()").value(1))
                .andExpect(jsonPath("$.artists[0].stageName").value("Solar Beat"));

        verify(eventService).addArtist("CMF-2026", 1L);
    }

    // TEST-CTRL-EVT-009
    @Test
    void shouldReturn200WhenSearchingEventsByArtist() throws Exception {
        when(eventService.findByArtist("Solar Beat")).thenReturn(List.of(summary()));

        mockMvc.perform(get("/api/events/by-artist").param("stageName", "Solar Beat"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].eventCode").value("CMF-2026"));

        verify(eventService).findByArtist("Solar Beat");
    }

    @Test
    void shouldReturn400WhenStageNameParameterIsMissing() throws Exception {
        mockMvc.perform(get("/api/events/by-artist"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Missing required parameter: stageName"));

        verify(eventService, never()).findByArtist(any());
    }
}
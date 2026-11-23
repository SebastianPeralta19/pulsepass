package com.pulsepass.dto.response;

import com.pulsepass.enums.EventCategory;
import com.pulsepass.enums.EventStatus;

import java.time.LocalDateTime;
import java.util.List;

public record EventResponse(
        Long id,
        String eventCode,
        String name,
        String description,
        EventCategory category,
        EventStatus status,
        LocalDateTime eventDate,
        Integer minimumAge,
        String venueCode,
        String venueName,
        List<ArtistResponse> artists
) {
}

package com.pulsepass.dto.response;

import com.pulsepass.enums.EventCategory;
import com.pulsepass.enums.EventStatus;

import java.time.LocalDateTime;

public record EventSummaryResponse(
        Long id,
        String eventCode,
        String name,
        EventCategory category,
        EventStatus status,
        LocalDateTime eventDate,
        String venueCode,
        String venueName
) {
}

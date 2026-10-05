package com.pulsepass.dto.request;

import com.pulsepass.enums.TicketType;

/** El precio NO viaja en el request: lo calcula el sistema. */
public record PurchaseTicketRequest(
        String userEmail,
        String eventCode,
        TicketType type
) {
}

package com.pulsepass.controller;

import com.pulsepass.dto.request.PurchaseTicketRequest;
import com.pulsepass.dto.response.TicketResponse;
import com.pulsepass.enums.TicketStatus;
import com.pulsepass.enums.TicketType;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.service.TicketService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
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

@WebMvcTest(TicketController.class)
class TicketControllerTest {

    private static final String VALID_PURCHASE_JSON = """
            {
              "userEmail": "andrea@email.com",
              "eventCode": "CMF-2026",
              "type": "VIP"
            }
            """;

    private static final String INVALID_PURCHASE_JSON = """
            {
              "userEmail": "no-es-un-email"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TicketService ticketService;

    private TicketResponse ticket(TicketStatus status) {
        return new TicketResponse(1L, "TCK-0001", TicketType.VIP, new BigDecimal("250000.00"),
                status, LocalDateTime.of(2026, 10, 11, 12, 0),
                "andrea@email.com", "CMF-2026", "Caribbean Music Fest 2026");
    }

    // TEST-CTRL-TKT-001 / AC-CTRL009
    @Test
    void shouldReturn201WhenPurchaseIsValid() throws Exception {
        when(ticketService.purchase(any(PurchaseTicketRequest.class)))
                .thenReturn(ticket(TicketStatus.PAID));

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PURCHASE_JSON))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.ticketCode").value("TCK-0001"))
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.type").value("VIP"))
                .andExpect(jsonPath("$.price").value(250000.0))
                .andExpect(jsonPath("$.userEmail").value("andrea@email.com"))
                .andExpect(jsonPath("$.eventCode").value("CMF-2026"))
                .andExpect(jsonPath("$.eventName").value("Caribbean Music Fest 2026"));

        verify(ticketService).purchase(any(PurchaseTicketRequest.class));
    }

    // TEST-CTRL-TKT-002
    @Test
    void shouldReturn400AndNotCallServiceWhenPurchaseRequestIsInvalid() throws Exception {
        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(INVALID_PURCHASE_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.userEmail").value("User email must be valid"))
                .andExpect(jsonPath("$.details.eventCode").value("Event code is required"))
                .andExpect(jsonPath("$.details.type").value("Ticket type is required"));

        verify(ticketService, never()).purchase(any());
    }

    // TEST-CTRL-TKT-003
    @Test
    void shouldReturn404WhenUserDoesNotExist() throws Exception {
        when(ticketService.purchase(any(PurchaseTicketRequest.class)))
                .thenThrow(new ResourceNotFoundException("User not found: andrea@email.com"));

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PURCHASE_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("User not found: andrea@email.com"));

        verify(ticketService).purchase(any(PurchaseTicketRequest.class));
    }

    // TEST-CTRL-TKT-004 / AC-CTRL010
    @Test
    void shouldReturn409WhenPurchaseViolatesBusinessRule() throws Exception {
        when(ticketService.purchase(any(PurchaseTicketRequest.class)))
                .thenThrow(new BusinessRuleException("User does not meet minimum age."));

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PURCHASE_JSON))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("User does not meet minimum age."));

        verify(ticketService).purchase(any(PurchaseTicketRequest.class));
    }

    // TEST-CTRL-TKT-005
    @Test
    void shouldReturn200WhenTicketExists() throws Exception {
        when(ticketService.findByCode("TCK-0001")).thenReturn(ticket(TicketStatus.PAID));

        mockMvc.perform(get("/api/tickets/TCK-0001"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.ticketCode").value("TCK-0001"))
                .andExpect(jsonPath("$.status").value("PAID"));

        verify(ticketService).findByCode("TCK-0001");
    }

    // TEST-CTRL-TKT-006
    @Test
    void shouldReturn200WithTicketsOfUser() throws Exception {
        when(ticketService.findByUserEmail("andrea@email.com"))
                .thenReturn(List.of(ticket(TicketStatus.PAID)));

        mockMvc.perform(get("/api/tickets/by-user").param("email", "andrea@email.com"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].userEmail").value("andrea@email.com"));

        verify(ticketService).findByUserEmail("andrea@email.com");
    }

    // TEST-CTRL-TKT-007
    @Test
    void shouldReturn200WithPaidTicketsOfEvent() throws Exception {
        when(ticketService.findPaidTicketsByEvent("CMF-2026"))
                .thenReturn(List.of(ticket(TicketStatus.PAID)));

        mockMvc.perform(get("/api/events/CMF-2026/tickets/paid"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("PAID"))
                .andExpect(jsonPath("$[0].eventCode").value("CMF-2026"));

        verify(ticketService).findPaidTicketsByEvent("CMF-2026");
    }

    // TEST-CTRL-TKT-008 / AC-CTRL011
    @Test
    void shouldReturn200WhenTicketIsCancelled() throws Exception {
        when(ticketService.cancel("TCK-0001")).thenReturn(ticket(TicketStatus.CANCELLED));

        mockMvc.perform(patch("/api/tickets/TCK-0001/cancel"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        verify(ticketService).cancel("TCK-0001");
    }

    // TEST-CTRL-TKT-009 / AC-CTRL012
    @Test
    void shouldReturn409WhenCancelViolatesBusinessRule() throws Exception {
        when(ticketService.cancel("TCK-0001"))
                .thenThrow(new BusinessRuleException("Only PAID tickets can be cancelled."));

        mockMvc.perform(patch("/api/tickets/TCK-0001/cancel"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Only PAID tickets can be cancelled."));

        verify(ticketService).cancel("TCK-0001");
    }

    // TEST-CTRL-TKT-010 / AC-CTRL013
    @Test
    void shouldReturn200WhenTicketIsMarkedAsUsed() throws Exception {
        when(ticketService.markAsUsed("TCK-0001")).thenReturn(ticket(TicketStatus.USED));

        mockMvc.perform(patch("/api/tickets/TCK-0001/use"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value("USED"));

        verify(ticketService).markAsUsed("TCK-0001");
    }

    // TEST-CTRL-TKT-011 / AC-CTRL014
    @Test
    void shouldReturn409WhenMarkAsUsedViolatesBusinessRule() throws Exception {
        when(ticketService.markAsUsed("TCK-0001"))
                .thenThrow(new BusinessRuleException("Only PAID tickets can be used."));

        mockMvc.perform(patch("/api/tickets/TCK-0001/use"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Only PAID tickets can be used."));

        verify(ticketService).markAsUsed("TCK-0001");
    }
}
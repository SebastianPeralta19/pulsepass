package com.pulsepass.controller;

import com.pulsepass.dto.request.PurchaseTicketRequest;
import com.pulsepass.dto.response.TicketResponse;
import com.pulsepass.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping("/tickets")
    public ResponseEntity<TicketResponse> purchase(@Valid @RequestBody PurchaseTicketRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.purchase(request));
    }

    @GetMapping("/tickets/by-user")
    public ResponseEntity<List<TicketResponse>> findByUserEmail(@RequestParam("email") String email) {
        return ResponseEntity.ok(ticketService.findByUserEmail(email));
    }

    @GetMapping("/tickets/{ticketCode}")
    public ResponseEntity<TicketResponse> findByCode(@PathVariable("ticketCode") String ticketCode) {
        return ResponseEntity.ok(ticketService.findByCode(ticketCode));
    }

    @GetMapping("/events/{eventCode}/tickets/paid")
    public ResponseEntity<List<TicketResponse>> findPaidTicketsByEvent(@PathVariable("eventCode") String eventCode) {
        return ResponseEntity.ok(ticketService.findPaidTicketsByEvent(eventCode));
    }

    @PatchMapping("/tickets/{ticketCode}/cancel")
    public ResponseEntity<TicketResponse> cancel(@PathVariable("ticketCode") String ticketCode) {
        return ResponseEntity.ok(ticketService.cancel(ticketCode));
    }

    @PatchMapping("/tickets/{ticketCode}/use")
    public ResponseEntity<TicketResponse> markAsUsed(@PathVariable("ticketCode") String ticketCode) {
        return ResponseEntity.ok(ticketService.markAsUsed(ticketCode));
    }
}
package com.pulsepass.service.impl;

import com.pulsepass.domain.Event;
import com.pulsepass.domain.Ticket;
import com.pulsepass.domain.User;
import com.pulsepass.dto.request.PurchaseTicketRequest;
import com.pulsepass.dto.response.TicketResponse;
import com.pulsepass.enums.EventStatus;
import com.pulsepass.enums.TicketStatus;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.TicketMapper;
import com.pulsepass.repository.EventRepository;
import com.pulsepass.repository.TicketRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.service.TicketPricingStrategy;
import com.pulsepass.service.TicketService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
import java.util.UUID;

@Service
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final TicketMapper ticketMapper;
    private final TicketPricingStrategy pricingStrategy;
    private final Clock clock;

    public TicketServiceImpl(TicketRepository ticketRepository,
                             UserRepository userRepository,
                             EventRepository eventRepository,
                             TicketMapper ticketMapper,
                             TicketPricingStrategy pricingStrategy,
                             Clock clock) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.ticketMapper = ticketMapper;
        this.pricingStrategy = pricingStrategy;
        this.clock = clock;
    }

    /**
     * Compra atómica: si cualquier validación falla se lanza una RuntimeException
     * y Spring hace ROLLBACK. El cambio a SOLD_OUT va en la misma transacción.
     */
    @Override
    @Transactional
    public TicketResponse purchase(PurchaseTicketRequest request) {
        validatePurchaseRequest(request);
        LocalDateTime now = LocalDateTime.now(clock);

        // 1. Usuario
        User user = userRepository.findByEmailIgnoreCase(request.userEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.userEmail()));
        if (!user.isActive()) {
            throw new BusinessRuleException("User is not active: " + user.getEmail());
        }

        // 2. Evento
        Event event = eventRepository.findByEventCode(request.eventCode())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + request.eventCode()));
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new BusinessRuleException(
                    "Tickets can only be purchased for PUBLISHED events. Current status: " + event.getStatus());
        }
        if (!event.getEventDate().isAfter(now)) {
            throw new BusinessRuleException("Event has already taken place: " + event.getEventCode());
        }

        // 3. Edad mínima (evaluada en la fecha del evento)
        validateMinimumAge(user, event);

        // 4. Capacidad
        int capacity = event.getVenue().getCapacity();
        long paidTickets = ticketRepository.countPaidTicketsByEventCode(event.getEventCode());
        if (paidTickets >= capacity) {
            throw new BusinessRuleException("Event has no available capacity: " + event.getEventCode());
        }

        // 5. Precio (lo decide el sistema, no el cliente)
        BigDecimal price = pricingStrategy.priceFor(request.type());
        if (price == null || price.signum() < 0) {
            throw new BusinessRuleException("Ticket price cannot be negative.");
        }

        // 6. Crear y guardar el ticket
        Ticket ticket = new Ticket(
                generateTicketCode(),
                request.type(),
                price,
                TicketStatus.PAID,
                now,
                user,
                event);
        Ticket saved = ticketRepository.save(ticket);

        // 7. Si se completó el aforo -> SOLD_OUT (misma transacción)
        if (paidTickets + 1 >= capacity) {
            event.setStatus(EventStatus.SOLD_OUT);
            eventRepository.save(event);
        }

        return ticketMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse findByCode(String ticketCode) {
        return ticketMapper.toResponse(getTicket(ticketCode));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> findByUserEmail(String email) {
        return ticketRepository.findByUserEmailIgnoreCaseOrderByPurchaseDateDesc(email)
                .stream()
                .map(ticketMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> findPaidTicketsByEvent(String eventCode) {
        return ticketRepository.findByEventEventCodeAndStatus(eventCode, TicketStatus.PAID)
                .stream()
                .map(ticketMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public TicketResponse cancel(String ticketCode) {
        Ticket ticket = getTicket(ticketCode);

        if (ticket.getStatus() == TicketStatus.USED) {
            throw new BusinessRuleException("A USED ticket cannot be cancelled: " + ticketCode);
        }
        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new BusinessRuleException("Ticket is already CANCELLED: " + ticketCode);
        }
        if (ticket.getStatus() != TicketStatus.PAID) {
            throw new BusinessRuleException("Only PAID tickets can be cancelled: " + ticketCode);
        }
        if (LocalDateTime.now(clock).isAfter(ticket.getEvent().getEventDate())) {
            throw new BusinessRuleException("Ticket cannot be cancelled after the event date: " + ticketCode);
        }

        ticket.setStatus(TicketStatus.CANCELLED);
        return ticketMapper.toResponse(ticketRepository.save(ticket));
    }

    @Override
    @Transactional
    public TicketResponse markAsUsed(String ticketCode) {
        Ticket ticket = getTicket(ticketCode);

        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new BusinessRuleException("A CANCELLED ticket cannot be used: " + ticketCode);
        }
        if (ticket.getStatus() != TicketStatus.PAID) {
            throw new BusinessRuleException("Only PAID tickets can be marked as used: " + ticketCode);
        }

        ticket.setStatus(TicketStatus.USED);
        return ticketMapper.toResponse(ticketRepository.save(ticket));
    }

    // ---------- helpers ----------

    private Ticket getTicket(String ticketCode) {
        return ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketCode));
    }

    private void validateMinimumAge(User user, Event event) {
        Integer minimumAge = event.getMinimumAge();
        if (minimumAge == null || minimumAge <= 0) {
            return;
        }
        LocalDate birthDate = user.getProfile() == null ? null : user.getProfile().getBirthDate();
        if (birthDate == null) {
            throw new BusinessRuleException(
                    "User birth date is required to purchase tickets for events with minimum age.");
        }
        int ageAtEvent = Period.between(birthDate, event.getEventDate().toLocalDate()).getYears();
        if (ageAtEvent < minimumAge) {
            throw new BusinessRuleException("User does not meet minimum age (" + minimumAge + ").");
        }
    }

    private void validatePurchaseRequest(PurchaseTicketRequest request) {
        if (request == null) {
            throw new BusinessRuleException("Request is required.");
        }
        if (request.userEmail() == null || request.userEmail().isBlank()) {
            throw new BusinessRuleException("User email is required.");
        }
        if (request.eventCode() == null || request.eventCode().isBlank()) {
            throw new BusinessRuleException("Event code is required.");
        }
        if (request.type() == null) {
            throw new BusinessRuleException("Ticket type is required.");
        }
    }

    private static String generateTicketCode() {
        return "TKT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }
}

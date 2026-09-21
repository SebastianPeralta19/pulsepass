package com.pulsepass.repository;

import com.pulsepass.AbstractIntegrationTest;
import com.pulsepass.domain.Event;
import com.pulsepass.domain.Ticket;
import com.pulsepass.domain.User;
import com.pulsepass.domain.Venue;
import com.pulsepass.enums.EventCategory;
import com.pulsepass.enums.EventStatus;
import com.pulsepass.enums.TicketStatus;
import com.pulsepass.enums.TicketType;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TicketRepositoryImplTest extends AbstractIntegrationTest {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private EntityManager entityManager;

    private Event persistEvent(String eventCode) {
        Venue venue = venueRepository.saveAndFlush(
                new Venue("VEN-" + eventCode, "Recinto " + eventCode, "Santa Marta", "Calle 1", 1000, true));
        return eventRepository.saveAndFlush(new Event(eventCode, "Evento " + eventCode, "desc",
                EventCategory.MUSIC, EventStatus.PUBLISHED, LocalDateTime.now().plusDays(30), 0, venue));
    }

    // AC-005: ticketCode unico
    @Test
    void shouldRejectDuplicateTicketCode() {
        User user = userRepository.saveAndFlush(new User("andrea", "andrea@example.com", true));
        Event event = persistEvent("CMF-2026");

        Ticket first = new Ticket("TCK-0001", TicketType.VIP, new BigDecimal("250000.00"),
                TicketStatus.PAID, LocalDateTime.now(), user, event);
        ticketRepository.saveAndFlush(first);

        Ticket duplicate = new Ticket("TCK-0001", TicketType.GENERAL, new BigDecimal("120000.00"),
                TicketStatus.RESERVED, LocalDateTime.now(), user, event);

        assertThatThrownBy(() -> ticketRepository.saveAndFlush(duplicate))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // FR-TKT-003: precio no negativo
    @Test
    void shouldRejectNegativePrice() {
        User user = userRepository.saveAndFlush(new User("carlos", "carlos@example.com", true));
        Event event = persistEvent("EVT-NEG");

        Ticket invalid = new Ticket("TCK-NEG-01", TicketType.GENERAL, new BigDecimal("-10.00"),
                TicketStatus.RESERVED, LocalDateTime.now(), user, event);

        assertThatThrownBy(() -> ticketRepository.saveAndFlush(invalid))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // FR-TKT-006 / QT-006: tickets de un usuario por email y status, navega Ticket -> User -> email
    @Test
    void shouldFindTicketsByUserEmailAndStatus() {
        User user = userRepository.saveAndFlush(new User("laura", "laura@example.com", true));
        Event event = persistEvent("EVT-LAU");

        ticketRepository.saveAll(List.of(
                new Ticket("TCK-L1", TicketType.GENERAL, new BigDecimal("120000.00"),
                        TicketStatus.RESERVED, LocalDateTime.now(), user, event),
                new Ticket("TCK-L2", TicketType.GENERAL, new BigDecimal("120000.00"),
                        TicketStatus.PAID, LocalDateTime.now(), user, event)
        ));
        entityManager.flush();
        entityManager.clear();

        List<Ticket> reserved = ticketRepository.findByUserEmailAndStatus("laura@example.com", TicketStatus.RESERVED);

        assertThat(reserved).extracting(Ticket::getTicketCode).containsExactly("TCK-L1");
    }

    // FR-TKT-007 / QT-006: tickets PAID de un evento mediante eventCode, navega Ticket -> Event
    @Test
    void shouldFindPaidTicketsByEventCode() {
        User user = userRepository.saveAndFlush(new User("miguel", "miguel@example.com", true));
        Event event = persistEvent("CMF-2026-B");

        ticketRepository.saveAll(List.of(
                new Ticket("TCK-M1", TicketType.VIP, new BigDecimal("250000.00"),
                        TicketStatus.PAID, LocalDateTime.now(), user, event),
                new Ticket("TCK-M2", TicketType.VIP, new BigDecimal("250000.00"),
                        TicketStatus.CANCELLED, LocalDateTime.now(), user, event)
        ));
        entityManager.flush();
        entityManager.clear();

        List<Ticket> paid = ticketRepository.findByEventEventCodeAndStatus("CMF-2026-B", TicketStatus.PAID);

        assertThat(paid).extracting(Ticket::getTicketCode).containsExactly("TCK-M1");
    }

    // FR-TKT-008 / AC-008: conteo de tickets PAID de un evento, solo cuentan los PAID
    @Test
    void shouldCountOnlyPaidTicketsForEvent() {
        User user = userRepository.saveAndFlush(new User("sofia", "sofia@example.com", true));
        Event event = persistEvent("EVT-COUNT");

        ticketRepository.saveAll(List.of(
                new Ticket("TCK-C1", TicketType.GENERAL, new BigDecimal("100000.00"),
                        TicketStatus.PAID, LocalDateTime.now(), user, event),
                new Ticket("TCK-C2", TicketType.GENERAL, new BigDecimal("100000.00"),
                        TicketStatus.PAID, LocalDateTime.now(), user, event),
                new Ticket("TCK-C3", TicketType.GENERAL, new BigDecimal("100000.00"),
                        TicketStatus.RESERVED, LocalDateTime.now(), user, event),
                new Ticket("TCK-C4", TicketType.GENERAL, new BigDecimal("100000.00"),
                        TicketStatus.CANCELLED, LocalDateTime.now(), user, event)
        ));
        entityManager.flush();
        entityManager.clear();

        long paidCount = ticketRepository.countPaidTicketsByEventCode("EVT-COUNT");

        assertThat(paidCount).isEqualTo(2);
    }
}
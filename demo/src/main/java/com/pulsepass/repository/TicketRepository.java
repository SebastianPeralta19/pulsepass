package com.pulsepass.repository;

import com.pulsepass.domain.Ticket;
import com.pulsepass.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByTicketCode(String ticketCode);

    List<Ticket> findByUserEmailIgnoreCaseOrderByPurchaseDateDesc(String email);

    // FR-TKT-006: tickets de un usuario por email, y opcionalmente por estado
    List<Ticket> findByUserEmail(String email);

    List<Ticket> findByUserEmailAndStatus(String email, TicketStatus status);

    // FR-TKT-007: tickets PAID de un evento mediante eventCode
    List<Ticket> findByEventEventCodeAndStatus(String eventCode, TicketStatus status);

    // FR-TKT-008: conteo de tickets PAID de un evento
    @Query("""
            SELECT COUNT(t) FROM Ticket t
            WHERE t.event.eventCode = :eventCode
            AND t.status = com.pulsepass.enums.TicketStatus.PAID
            """)
    long countPaidTicketsByEventCode(@Param("eventCode") String eventCode);

    // FR-SRC-004: tickets cuyo evento es posterior a una fecha, ordenados cronologicamente
    @Query("""
            SELECT t FROM Ticket t
            WHERE t.event.eventDate > :afterDate
            ORDER BY t.event.eventDate ASC
            """)
    List<Ticket> findByEventDateAfter(@Param("afterDate") LocalDateTime afterDate);
}
package com.pulsepass.service.impl;

import com.pulsepass.domain.Event;
import com.pulsepass.domain.Ticket;
import com.pulsepass.domain.User;
import com.pulsepass.domain.UserProfile;
import com.pulsepass.domain.Venue;
import com.pulsepass.dto.request.PurchaseTicketRequest;
import com.pulsepass.dto.response.TicketResponse;
import com.pulsepass.enums.EventCategory;
import com.pulsepass.enums.EventStatus;
import com.pulsepass.enums.TicketStatus;
import com.pulsepass.enums.TicketType;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.TicketMapper;
import com.pulsepass.repository.EventRepository;
import com.pulsepass.repository.TicketRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.service.AuthorizationService;
import com.pulsepass.service.TicketPricingStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketServiceImplTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-05T10:00:00Z"), ZoneOffset.UTC);
    private static final LocalDateTime EVENT_DATE = LocalDateTime.of(2026, 12, 12, 20, 0);
    private static final LocalDateTime PAST_DATE = LocalDateTime.of(2026, 1, 1, 20, 0);

    @Mock
    private TicketRepository ticketRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private TicketMapper ticketMapper;
    @Mock
    private TicketPricingStrategy pricingStrategy;
    @Mock
    private AuthorizationService authorizationService;

    private TicketServiceImpl service;

    private Venue venue;   // capacidad 3, activo
    private Event event;   // CMF-2026, PUBLISHED, +18

    @BeforeEach
    void setUp() {
        service = new TicketServiceImpl(ticketRepository, userRepository, eventRepository,
                ticketMapper, pricingStrategy, authorizationService, CLOCK);
        venue = new Venue("VEN-SMR-01", "Marina Convention Center", "Santa Marta", "Calle 1", 3, true);
        event = new Event("CMF-2026", "Caribbean Music Fest 2026", "Festival", EventCategory.MUSIC,
                EventStatus.PUBLISHED, EVENT_DATE, 18, venue);
    }

    // ---------- fixtures ----------

    /** birthDate: Andrea 25 años al evento, Carlos 21, Laura 17. */
    private static User user(String name, LocalDate birthDate, boolean active) {
        User user = new User(name, name + "@email.com", active);
        user.setProfile(new UserProfile(name, "Test", null, "Santa Marta", birthDate));
        return user;
    }

    private static User andrea() {
        return user("andrea", LocalDate.of(2001, 1, 10), true);
    }

    private static PurchaseTicketRequest purchase(String name) {
        return new PurchaseTicketRequest(name + "@email.com", "CMF-2026", TicketType.VIP);
    }

    private static Ticket ticket(TicketStatus status, Event event) {
        return new Ticket("TKT-1", TicketType.VIP, new BigDecimal("250.00"), status,
                LocalDateTime.of(2026, 10, 1, 9, 0), andrea(), event);
    }

    private static TicketResponse responseOf(Ticket t) {
        return new TicketResponse(t.getId(), t.getTicketCode(), t.getType(), t.getPrice(), t.getStatus(),
                t.getPurchaseDate(), t.getUser().getEmail(), t.getEvent().getEventCode(), t.getEvent().getName());
    }

    private void stubMapper() {
        when(ticketMapper.toResponse(any(Ticket.class))).thenAnswer(inv -> responseOf(inv.getArgument(0)));
    }

    private void stubUserAndEvent(User user) {
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
    }

    // ---------- purchase ----------

    @Test
    void purchase_validRequest_createsPaidTicket() {
        // ARRANGE
        User andrea = andrea();
        stubUserAndEvent(andrea);
        when(ticketRepository.countPaidTicketsByEventCode("CMF-2026")).thenReturn(0L);
        when(pricingStrategy.priceFor(TicketType.VIP)).thenReturn(new BigDecimal("250.00"));
        when(ticketRepository.save(any(Ticket.class))).then(returnsFirstArg());
        stubMapper();

        // ACT
        TicketResponse result = service.purchase(purchase("andrea"));

        // ASSERT
        ArgumentCaptor<Ticket> captor = ArgumentCaptor.forClass(Ticket.class);
        verify(ticketRepository).save(captor.capture());
        Ticket saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(TicketStatus.PAID);
        assertThat(saved.getPrice()).isEqualByComparingTo("250.00");
        assertThat(saved.getTicketCode()).startsWith("TKT-");
        assertThat(saved.getUser()).isSameAs(andrea);
        assertThat(saved.getEvent()).isSameAs(event);
        assertThat(result.status()).isEqualTo(TicketStatus.PAID);
        assertThat(result.userEmail()).isEqualTo("andrea@email.com");
        assertThat(event.getStatus()).isEqualTo(EventStatus.PUBLISHED);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void purchase_unknownUser_throwsNotFound() {
        // ARRANGE
        when(userRepository.findByEmailIgnoreCase("ghost@email.com")).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.purchase(purchase("ghost")))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void purchase_inactiveUser_throwsBusinessRule() {
        // ARRANGE
        User miguel = user("miguel", LocalDate.of(1996, 3, 3), false);
        when(userRepository.findByEmailIgnoreCase("miguel@email.com")).thenReturn(Optional.of(miguel));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.purchase(purchase("miguel")))
                .isInstanceOf(BusinessRuleException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void purchase_unknownEvent_throwsNotFound() {
        // ARRANGE
        User andrea = andrea();
        when(userRepository.findByEmailIgnoreCase(andrea.getEmail())).thenReturn(Optional.of(andrea));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.purchase(purchase("andrea")))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void purchase_draftEvent_throwsBusinessRule() {
        // ARRANGE
        event.setStatus(EventStatus.DRAFT);
        stubUserAndEvent(andrea());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.purchase(purchase("andrea")))
                .isInstanceOf(BusinessRuleException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void purchase_cancelledEvent_throwsBusinessRule() {
        // ARRANGE
        event.setStatus(EventStatus.CANCELLED);
        stubUserAndEvent(andrea());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.purchase(purchase("andrea")))
                .isInstanceOf(BusinessRuleException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void purchase_soldOutEvent_throwsBusinessRule() {
        // ARRANGE
        event.setStatus(EventStatus.SOLD_OUT);
        stubUserAndEvent(andrea());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.purchase(purchase("andrea")))
                .isInstanceOf(BusinessRuleException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void purchase_eventAlreadyHappened_throwsBusinessRule() {
        // ARRANGE
        event.setEventDate(PAST_DATE);
        stubUserAndEvent(andrea());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.purchase(purchase("andrea")))
                .isInstanceOf(BusinessRuleException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void purchase_underageUser_throwsBusinessRule() {
        // ARRANGE: Laura tiene 17 años el día del evento
        User laura = user("laura", LocalDate.of(2009, 5, 1), true);
        stubUserAndEvent(laura);

        // ACT + ASSERT
        assertThatThrownBy(() -> service.purchase(purchase("laura")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("minimum age");
        verify(ticketRepository, never()).save(any());
        verify(eventRepository, never()).save(any());
    }

    @Test
    void purchase_ageIsEvaluatedAtEventDate_notToday() {
        // ARRANGE: hoy (2026-10-05) tiene 17, pero el 2026-12-12 cumple 18
        User almost18 = user("sofia", LocalDate.of(2008, 11, 20), true);
        stubUserAndEvent(almost18);
        when(ticketRepository.countPaidTicketsByEventCode("CMF-2026")).thenReturn(0L);
        when(pricingStrategy.priceFor(TicketType.VIP)).thenReturn(new BigDecimal("250.00"));
        when(ticketRepository.save(any(Ticket.class))).then(returnsFirstArg());
        stubMapper();

        // ACT
        TicketResponse result = service.purchase(purchase("sofia"));

        // ASSERT
        assertThat(result.status()).isEqualTo(TicketStatus.PAID);
    }

    @Test
    void purchase_eventWithoutAgeRestriction_ignoresBirthDate() {
        // ARRANGE
        event.setMinimumAge(0);
        User noBirthDate = user("kid", null, true);
        stubUserAndEvent(noBirthDate);
        when(ticketRepository.countPaidTicketsByEventCode("CMF-2026")).thenReturn(0L);
        when(pricingStrategy.priceFor(TicketType.VIP)).thenReturn(new BigDecimal("250.00"));
        when(ticketRepository.save(any(Ticket.class))).then(returnsFirstArg());
        stubMapper();

        // ACT
        TicketResponse result = service.purchase(purchase("kid"));

        // ASSERT
        assertThat(result.status()).isEqualTo(TicketStatus.PAID);
    }

    @Test
    void purchase_noCapacityLeft_throwsBusinessRule() {
        // ARRANGE: capacidad 3 y ya hay 3 pagados
        stubUserAndEvent(andrea());
        when(ticketRepository.countPaidTicketsByEventCode("CMF-2026")).thenReturn(3L);

        // ACT + ASSERT
        assertThatThrownBy(() -> service.purchase(purchase("andrea")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("capacity");
        verify(ticketRepository, never()).save(any());
        verify(eventRepository, never()).save(any());
    }

    @Test
    void purchase_lastAvailableTicket_savesTicketAndMarksEventSoldOut() {
        // ARRANGE: 2 pagados de 3 -> esta compra completa el aforo
        stubUserAndEvent(andrea());
        when(ticketRepository.countPaidTicketsByEventCode("CMF-2026")).thenReturn(2L);
        when(pricingStrategy.priceFor(TicketType.VIP)).thenReturn(new BigDecimal("250.00"));
        when(ticketRepository.save(any(Ticket.class))).then(returnsFirstArg());
        stubMapper();

        // ACT
        service.purchase(purchase("andrea"));

        // ASSERT
        verify(ticketRepository).save(any(Ticket.class));
        assertThat(event.getStatus()).isEqualTo(EventStatus.SOLD_OUT);
        verify(eventRepository).save(event);
    }

    @Test
    void purchase_delegatesPriceToStrategyWithRequestedType() {
        // ARRANGE
        stubUserAndEvent(andrea());
        when(ticketRepository.countPaidTicketsByEventCode("CMF-2026")).thenReturn(0L);
        when(pricingStrategy.priceFor(TicketType.STUDENT)).thenReturn(new BigDecimal("70.00"));
        when(ticketRepository.save(any(Ticket.class))).then(returnsFirstArg());
        stubMapper();

        // ACT
        TicketResponse result = service.purchase(
                new PurchaseTicketRequest("andrea@email.com", "CMF-2026", TicketType.STUDENT));

        // ASSERT
        assertThat(result.price()).isEqualByComparingTo("70.00");
        verify(pricingStrategy).priceFor(eq(TicketType.STUDENT));
    }

    @Test
    void purchase_acceptanceScenario_threeSalesThenSoldOutAndFourthRejected() {
        // ARRANGE: AC-004, AC-005, AC-008, AC-009
        User andrea = andrea();
        User carlos = user("carlos", LocalDate.of(2005, 6, 1), true);   // 21 años
        User sofia = user("sofia", LocalDate.of(1998, 2, 2), true);     // adulta
        User pedro = user("pedro", LocalDate.of(1990, 2, 2), true);     // cuarto comprador
        when(userRepository.findByEmailIgnoreCase("andrea@email.com")).thenReturn(Optional.of(andrea));
        when(userRepository.findByEmailIgnoreCase("carlos@email.com")).thenReturn(Optional.of(carlos));
        when(userRepository.findByEmailIgnoreCase("sofia@email.com")).thenReturn(Optional.of(sofia));
        when(userRepository.findByEmailIgnoreCase("pedro@email.com")).thenReturn(Optional.of(pedro));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(ticketRepository.countPaidTicketsByEventCode("CMF-2026")).thenReturn(0L, 1L, 2L);
        when(pricingStrategy.priceFor(TicketType.VIP)).thenReturn(new BigDecimal("250.00"));
        when(ticketRepository.save(any(Ticket.class))).then(returnsFirstArg());
        stubMapper();

        // ACT
        service.purchase(purchase("andrea"));
        service.purchase(purchase("carlos"));
        assertThat(event.getStatus()).isEqualTo(EventStatus.PUBLISHED);
        service.purchase(purchase("sofia"));

        // ASSERT
        assertThat(event.getStatus()).isEqualTo(EventStatus.SOLD_OUT);
        assertThatThrownBy(() -> service.purchase(purchase("pedro")))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void purchase_missingType_throwsBusinessRuleBeforeTouchingRepositories() {
        // ACT + ASSERT
        assertThatThrownBy(() -> service.purchase(
                new PurchaseTicketRequest("andrea@email.com", "CMF-2026", null)))
                .isInstanceOf(BusinessRuleException.class);
        verify(ticketRepository, never()).save(any());
    }

    // ---------- cancel ----------

    @Test
    void cancel_paidTicket_becomesCancelled() {
        // ARRANGE
        Ticket paid = ticket(TicketStatus.PAID, event);
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(paid));
        when(ticketRepository.save(any(Ticket.class))).then(returnsFirstArg());
        stubMapper();

        // ACT
        TicketResponse result = service.cancel("TKT-1");

        // ASSERT
        assertThat(result.status()).isEqualTo(TicketStatus.CANCELLED);
        verify(ticketRepository).save(paid);
    }

    @Test
    void cancel_usedTicket_throwsBusinessRule() {
        // ARRANGE
        when(ticketRepository.findByTicketCode("TKT-1"))
                .thenReturn(Optional.of(ticket(TicketStatus.USED, event)));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.cancel("TKT-1"))
                .isInstanceOf(BusinessRuleException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void cancel_alreadyCancelledTicket_throwsBusinessRule() {
        // ARRANGE
        when(ticketRepository.findByTicketCode("TKT-1"))
                .thenReturn(Optional.of(ticket(TicketStatus.CANCELLED, event)));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.cancel("TKT-1"))
                .isInstanceOf(BusinessRuleException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void cancel_afterEventDate_throwsBusinessRule() {
        // ARRANGE
        event.setEventDate(PAST_DATE);
        when(ticketRepository.findByTicketCode("TKT-1"))
                .thenReturn(Optional.of(ticket(TicketStatus.PAID, event)));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.cancel("TKT-1"))
                .isInstanceOf(BusinessRuleException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void cancel_unknownTicket_throwsNotFound() {
        // ARRANGE
        when(ticketRepository.findByTicketCode("NOPE")).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.cancel("NOPE"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ---------- markAsUsed ----------

    @Test
    void markAsUsed_paidTicket_becomesUsed() {
        // ARRANGE
        Ticket paid = ticket(TicketStatus.PAID, event);
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(paid));
        when(ticketRepository.save(any(Ticket.class))).then(returnsFirstArg());
        stubMapper();

        // ACT
        TicketResponse result = service.markAsUsed("TKT-1");

        // ASSERT
        assertThat(result.status()).isEqualTo(TicketStatus.USED);
        verify(ticketRepository).save(paid);
    }

    @Test
    void markAsUsed_cancelledTicket_throwsBusinessRule() {
        // ARRANGE
        when(ticketRepository.findByTicketCode("TKT-1"))
                .thenReturn(Optional.of(ticket(TicketStatus.CANCELLED, event)));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.markAsUsed("TKT-1"))
                .isInstanceOf(BusinessRuleException.class);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void markAsUsed_alreadyUsedTicket_throwsBusinessRule() {
        // ARRANGE
        when(ticketRepository.findByTicketCode("TKT-1"))
                .thenReturn(Optional.of(ticket(TicketStatus.USED, event)));

        // ACT + ASSERT
        assertThatThrownBy(() -> service.markAsUsed("TKT-1"))
                .isInstanceOf(BusinessRuleException.class);
        verify(ticketRepository, never()).save(any());
    }

    // ---------- consultas ----------

    @Test
    void findByCode_existing_returnsDto() {
        // ARRANGE
        Ticket paid = ticket(TicketStatus.PAID, event);
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(paid));
        stubMapper();

        // ACT + ASSERT
        assertThat(service.findByCode("TKT-1").ticketCode()).isEqualTo("TKT-1");
    }

    @Test
    void findByUserEmail_usesCaseInsensitiveOrderedQuery() {
        // ARRANGE
        when(userRepository.findByEmailIgnoreCase("ANDREA@email.com"))
                .thenReturn(Optional.of(andrea()));
        when(ticketRepository.findByUserEmailIgnoreCaseOrderByPurchaseDateDesc("ANDREA@email.com"))
                .thenReturn(List.of(ticket(TicketStatus.PAID, event)));
        stubMapper();

        // ACT
        List<TicketResponse> result = service.findByUserEmail("ANDREA@email.com");

        // ASSERT
        assertThat(result).hasSize(1);
    }

    // ---------- autorización (FR-SEC-TKT) ----------

    @Test
    void findByUserEmail_checksOwnershipBeforeReturningTickets() {
        // ARRANGE
        User andrea = andrea();
        when(userRepository.findByEmailIgnoreCase("andrea@email.com")).thenReturn(Optional.of(andrea));
        when(ticketRepository.findByUserEmailIgnoreCaseOrderByPurchaseDateDesc("andrea@email.com"))
                .thenReturn(List.of());

        // ACT
        service.findByUserEmail("andrea@email.com");

        // ASSERT: la frontera de negocio decide la propiedad, no el cliente.
        verify(authorizationService).requireSelfOrAdmin(andrea.getId());
    }

    @Test
    void findByCode_checksTicketReadAuthorization() {
        // ARRANGE
        Ticket paid = ticket(TicketStatus.PAID, event);
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(paid));
        stubMapper();

        // ACT
        service.findByCode("TKT-1");

        // ASSERT
        verify(authorizationService).requireTicketRead(paid);
    }

    @Test
    void cancel_checksTicketCancellationAuthorization() {
        // ARRANGE
        Ticket paid = ticket(TicketStatus.PAID, event);
        when(ticketRepository.findByTicketCode("TKT-1")).thenReturn(Optional.of(paid));
        when(ticketRepository.save(any(Ticket.class))).then(returnsFirstArg());
        stubMapper();

        // ACT
        service.cancel("TKT-1");

        // ASSERT
        verify(authorizationService).requireTicketCancellation(paid);
    }

    @Test
    void purchase_checksThatRequesterRepresentsTargetUser() {
        // ARRANGE
        User andrea = andrea();
        stubUserAndEvent(andrea);
        when(ticketRepository.countPaidTicketsByEventCode("CMF-2026")).thenReturn(0L);
        when(pricingStrategy.priceFor(TicketType.VIP)).thenReturn(new BigDecimal("250.00"));
        when(ticketRepository.save(any(Ticket.class))).then(returnsFirstArg());
        stubMapper();

        // ACT
        service.purchase(purchase("andrea"));

        // ASSERT
        verify(authorizationService).requirePurchaseFor(andrea.getId());
    }

    @Test
    void findPaidTicketsByEvent_queriesOnlyPaidStatus() {
        // ARRANGE
        when(ticketRepository.findByEventEventCodeAndStatus("CMF-2026", TicketStatus.PAID))
                .thenReturn(List.of(ticket(TicketStatus.PAID, event)));
        stubMapper();

        // ACT
        List<TicketResponse> result = service.findPaidTicketsByEvent("CMF-2026");

        // ASSERT
        assertThat(result).hasSize(1);
        verify(ticketRepository).findByEventEventCodeAndStatus("CMF-2026", TicketStatus.PAID);
    }
}

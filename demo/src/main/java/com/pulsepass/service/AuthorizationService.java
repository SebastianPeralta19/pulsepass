package com.pulsepass.service;

import com.pulsepass.domain.Ticket;
import com.pulsepass.enums.Role;
import com.pulsepass.security.UserPrincipal;

import java.util.Optional;

/**
 * Decide si la identidad autenticada puede operar sobre un recurso concreto.
 * Nunca confía en identificadores enviados por el cliente: compara siempre el
 * id persistente del principal.
 */
public interface AuthorizationService {

    /** Principal autenticado o fallo de autorización si no existe. */
    UserPrincipal currentPrincipal();

    Optional<UserPrincipal> currentPrincipalIfPresent();

    boolean hasAnyRole(Role... roles);

    /** Exige uno de los roles indicados (comprobación de defensa en profundidad). */
    void requireAnyRole(Role... roles);

    /**
     * Permite operar cuando el recurso pertenece al principal o cuando el
     * principal es ADMIN. Pensado para datos personales y tickets.
     */
    void requireSelfOrAdmin(Long resourceOwnerId);

    /** Lectura de ticket: propietario, o STAFF/ADMIN en operación autorizada. */
    void requireTicketRead(Ticket ticket);

    /** Cancelación de ticket: propietario o ADMIN expresamente autorizado. */
    void requireTicketCancellation(Ticket ticket);

    /** Compra: el correo del request debe representar al principal (o ADMIN). */
    void requirePurchaseFor(Long targetUserId);
}

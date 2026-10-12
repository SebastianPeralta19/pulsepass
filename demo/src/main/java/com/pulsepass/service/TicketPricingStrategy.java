package com.pulsepass.service;

import com.pulsepass.enums.TicketType;

import java.math.BigDecimal;

/** Estrategia encapsulada para calcular el precio de un ticket. */
public interface TicketPricingStrategy {

    BigDecimal priceFor(TicketType type);
}

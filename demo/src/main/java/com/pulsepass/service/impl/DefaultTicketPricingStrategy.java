package com.pulsepass.service.impl;

import com.pulsepass.enums.TicketType;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.service.TicketPricingStrategy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.EnumMap;
import java.util.Map;

/**
 * GENERAL = precio base, STUDENT = 30% de descuento,
 * VIP = x2.5, BACKSTAGE = x4.
 */
@Component
public class DefaultTicketPricingStrategy implements TicketPricingStrategy {

    private final BigDecimal basePrice;
    private final Map<TicketType, BigDecimal> multipliers = new EnumMap<>(TicketType.class);

    public DefaultTicketPricingStrategy(
            @Value("${pulsepass.pricing.base-price:100.00}") BigDecimal basePrice) {
        if (basePrice == null || basePrice.signum() < 0) {
            throw new IllegalArgumentException("Base price must be zero or greater.");
        }
        this.basePrice = basePrice;
        multipliers.put(TicketType.GENERAL, new BigDecimal("1.00"));
        multipliers.put(TicketType.STUDENT, new BigDecimal("0.70"));
        multipliers.put(TicketType.VIP, new BigDecimal("2.50"));
        multipliers.put(TicketType.BACKSTAGE, new BigDecimal("4.00"));
    }

    @Override
    public BigDecimal priceFor(TicketType type) {
        if (type == null || !multipliers.containsKey(type)) {
            throw new BusinessRuleException("Ticket type is required to calculate the price.");
        }
        BigDecimal price = basePrice.multiply(multipliers.get(type)).setScale(2, RoundingMode.HALF_UP);
        if (price.signum() < 0) {
            throw new BusinessRuleException("Ticket price cannot be negative.");
        }
        return price;
    }
}

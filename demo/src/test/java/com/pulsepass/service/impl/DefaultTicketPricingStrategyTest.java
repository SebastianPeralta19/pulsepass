package com.pulsepass.service.impl;

import com.pulsepass.enums.TicketType;
import com.pulsepass.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DefaultTicketPricingStrategyTest {

    private final DefaultTicketPricingStrategy strategy =
            new DefaultTicketPricingStrategy(new BigDecimal("100.00"));

    @Test
    void generalCostsBasePrice() {
        assertThat(strategy.priceFor(TicketType.GENERAL)).isEqualByComparingTo("100.00");
    }

    @Test
    void studentHasDiscount() {
        assertThat(strategy.priceFor(TicketType.STUDENT)).isEqualByComparingTo("70.00");
    }

    @Test
    void vipUsesMultiplier() {
        assertThat(strategy.priceFor(TicketType.VIP)).isEqualByComparingTo("250.00");
    }

    @Test
    void backstageIsMoreExpensiveThanVip() {
        assertThat(strategy.priceFor(TicketType.BACKSTAGE))
                .isEqualByComparingTo("400.00")
                .isGreaterThan(strategy.priceFor(TicketType.VIP));
    }

    @Test
    void neverReturnsNegativePrice() {
        for (TicketType type : TicketType.values()) {
            assertThat(strategy.priceFor(type).signum()).isGreaterThanOrEqualTo(0);
        }
    }

    @Test
    void nullTypeIsRejected() {
        assertThatThrownBy(() -> strategy.priceFor(null))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void negativeBasePriceIsRejected() {
        assertThatThrownBy(() -> new DefaultTicketPricingStrategy(new BigDecimal("-1")))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

package com.pulsepass.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * Expone el reloj del sistema como bean para poder fijarlo en los unit tests
 * (Clock.fixed) y evitar tests que dependan de la fecha real.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}

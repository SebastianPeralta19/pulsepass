package com.pulsepass.exception;

/** El recurso existe, pero la operación viola una regla de negocio. */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }
}

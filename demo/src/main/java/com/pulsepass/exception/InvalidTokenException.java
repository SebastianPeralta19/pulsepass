package com.pulsepass.exception;

/**
 * Token Bearer ausente, malformado, manipulado, vencido o emitido por otro
 * emisor. Nunca concede acceso.
 */
public class InvalidTokenException extends RuntimeException {

    public InvalidTokenException(String message) {
        super(message);
    }

    public InvalidTokenException(String message, Throwable cause) {
        super(message, cause);
    }
}

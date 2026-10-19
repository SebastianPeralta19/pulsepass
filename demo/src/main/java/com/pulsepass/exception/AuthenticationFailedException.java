package com.pulsepass.exception;

/**
 * Fallo de autenticación (credenciales incorrectas, usuario inactivo o
 * inexistente). El mensaje expuesto al cliente es deliberadamente genérico
 * para no revelar si el usuario existe.
 */
public class AuthenticationFailedException extends RuntimeException {

    public AuthenticationFailedException(String message) {
        super(message);
    }

    public AuthenticationFailedException(String message, Throwable cause) {
        super(message, cause);
    }
}

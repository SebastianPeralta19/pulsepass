package com.pulsepass.security;

/**
 * Mensajes uniformes de seguridad. Evitan filtrar detalles internos en las
 * respuestas 401/403 tanto del filtro como del manejo de excepciones.
 */
public final class SecurityMessages {

    public static final String UNAUTHORIZED_MESSAGE = "Authentication is required to access this resource";
    public static final String FORBIDDEN_MESSAGE = "No tiene permisos para realizar esta operación";

    private SecurityMessages() {
    }
}

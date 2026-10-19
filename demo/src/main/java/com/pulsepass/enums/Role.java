package com.pulsepass.enums;

/**
 * Roles del MVP. Se almacenan sin prefijo; Spring Security los expone como
 * authorities con el prefijo ROLE_ (ver UserPrincipal).
 */
public enum Role {
    USER,
    STAFF,
    ADMIN
}

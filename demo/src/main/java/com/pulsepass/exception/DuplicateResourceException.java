package com.pulsepass.exception;

/** Conflicto de unicidad: el recurso ya existe. */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}

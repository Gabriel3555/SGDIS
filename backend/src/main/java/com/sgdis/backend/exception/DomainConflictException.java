package com.sgdis.backend.exception;

public class DomainConflictException extends BusinessException {
    public DomainConflictException(String message) {
        super(message, "CONFLICT");
    }
}


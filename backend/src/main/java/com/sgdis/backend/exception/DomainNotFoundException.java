package com.sgdis.backend.exception;

public class DomainNotFoundException extends BusinessException {
    public DomainNotFoundException(String message) {
        super(message, "NOT_FOUND");
    }
}

package com.sgdis.backend.exception;

public class DomainValidationException extends BusinessException {
    public DomainValidationException(String message) {
        super(message, "DOMAIN_VALIDATION");
    }
}
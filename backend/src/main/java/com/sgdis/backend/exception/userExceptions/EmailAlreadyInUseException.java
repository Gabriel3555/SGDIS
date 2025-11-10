package com.sgdis.backend.exception.userExceptions;

import com.sgdis.backend.exception.DomainConflictException;

public class EmailAlreadyInUseException extends DomainConflictException {
    public EmailAlreadyInUseException(String email) {
        super("Email already in use: " + email);
    }
}
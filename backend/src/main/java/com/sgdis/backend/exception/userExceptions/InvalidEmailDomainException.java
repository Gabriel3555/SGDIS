package com.sgdis.backend.exception.userExceptions;

import com.sgdis.backend.exception.DomainValidationException;

public class InvalidEmailDomainException extends DomainValidationException {
    public InvalidEmailDomainException(String email) {
        super("Email domain not allowed: " + email + ". Allowed: @soy.sena.edu.co, @sena.edu.co");
    }
}

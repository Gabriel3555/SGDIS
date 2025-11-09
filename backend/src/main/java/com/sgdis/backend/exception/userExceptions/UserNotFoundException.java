package com.sgdis.backend.exception.userExceptions;

import com.sgdis.backend.exception.DomainNotFoundException;

public class UserNotFoundException extends DomainNotFoundException {
    public UserNotFoundException(Long id) {
        super("No user found with id " + id);
    }
    public UserNotFoundException(String email) {
        super("No user found with email " + email);
    }
}

package com.sgdis.backend.exception.userExceptions;

import com.sgdis.backend.exception.DomainNotFoundException;

public class RegionalNotFoundException extends DomainNotFoundException {
    public RegionalNotFoundException(Long id) {
        super("No regional found with id " + id);
    }
}

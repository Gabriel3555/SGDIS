package com.sgdis.backend.exception.userExceptions;

import com.sgdis.backend.exception.DomainConflictException;

public class UserAlreadyAssignedToRegionalException extends DomainConflictException {
    public UserAlreadyAssignedToRegionalException(Long userId, Long regionalId) {
        super("User " + userId + " is already assigned to regional " + regionalId);
    }
}


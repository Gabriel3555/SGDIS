package com.sgdis.backend.auth.application.port.out;

import com.sgdis.backend.auth.domain.User;

import java.util.Optional;

public interface GetUserByIdRepository {
    Optional<User> findById(Long id);
}
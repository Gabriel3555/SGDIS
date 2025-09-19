package com.sgdis.backend.user.application.port.out;


import com.sgdis.backend.user.domain.User;

import java.util.Optional;

public interface GetUserByIdRepository {
    Optional<User> findById(Long id);
}
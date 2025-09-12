package com.sgdis.backend.auth.application.port.out;

import com.sgdis.backend.auth.infrastructure.entity.UserEntity;

public interface GetUserByIdRepository {
    UserEntity getUserById(Long id);
}

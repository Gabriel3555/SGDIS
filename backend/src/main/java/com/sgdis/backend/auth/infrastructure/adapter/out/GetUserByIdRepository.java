package com.sgdis.backend.auth.infrastructure.adapter.out;

import com.sgdis.backend.auth.infrastructure.entity.UserEntity;

public interface GetUserByIdRepository {
    UserEntity findById(Long id);
}
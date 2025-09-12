package com.sgdis.backend.auth.infrastructure.repository;

import com.sgdis.backend.auth.application.port.out.GetUserByIdRepository;
import com.sgdis.backend.auth.infrastructure.entity.UserEntity;
import org.springframework.stereotype.Repository;

@Repository
public class JpaUserRepository implements GetUserByIdRepository {
    @Override
    public UserEntity getUserById(Long id) {
        return null;
    }
}

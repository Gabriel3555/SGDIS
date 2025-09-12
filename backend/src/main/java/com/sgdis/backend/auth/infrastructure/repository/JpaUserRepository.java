package com.sgdis.backend.auth.infrastructure.repository;

import com.sgdis.backend.auth.application.port.out.GetUserByIdRepository;
import com.sgdis.backend.auth.domain.User;
import com.sgdis.backend.auth.infrastructure.entity.UserEntity;
import com.sgdis.backend.auth.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class JpaUserRepository implements GetUserByIdRepository {

    private final SpringDataUserRepository repository;

    @Override
    public Optional<User> findById(Long id) {
        return repository.findById(id).stream().map(UserMapper::toDomain).findFirst();
    }
}

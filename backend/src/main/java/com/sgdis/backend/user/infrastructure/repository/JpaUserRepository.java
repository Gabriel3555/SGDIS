package com.sgdis.backend.user.infrastructure.repository;

import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.user.application.port.in.GetUserByIdUseCase;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class JpaUserRepository implements GetUserByIdUseCase {

    private final SpringDataUserRepository repository;

    @Override
    public User findById(Long id) {
        return repository.findById(id)
                .stream()
                .map(UserMapper::toDomain)
                .findFirst()
                .orElseThrow(()->new ResourceNotFoundException("No user found with id " + id));
    }
}

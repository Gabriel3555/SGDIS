package com.sgdis.backend.user.application.service;


import com.sgdis.backend.user.application.dto.CreateUserRequest;
import com.sgdis.backend.user.application.dto.UserResponse;

import com.sgdis.backend.user.application.port.in.GetUserByIdUseCase;
import com.sgdis.backend.user.application.port.out.GetUserByIdRepository;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService implements GetUserByIdUseCase {

    private final GetUserByIdRepository repository;
    private final SpringDataUserRepository springDataUserRepository;

    @Override
    public UserResponse getUserById(Long id) {
        return repository.findById(id)
                .map(UserMapper::toResponse)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}

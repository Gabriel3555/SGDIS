package com.sgdis.backend.auth.application.service;

import com.sgdis.backend.auth.application.dto.UserResponse;
import com.sgdis.backend.auth.application.port.in.GetUserByIdUseCase;
import com.sgdis.backend.auth.application.port.out.GetUserByIdRepository;
import com.sgdis.backend.auth.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService implements GetUserByIdUseCase {

    private final GetUserByIdRepository repository;

    @Override
    public UserResponse getUserById(Long id) {
        return repository.findById(id)
                .map(UserMapper::toResponse)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}

package com.sgdis.backend.user.infrastructure.repository;

import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.user.application.dto.UserResponse;
import com.sgdis.backend.user.application.port.in.GetUserByIdUseCase;
import com.sgdis.backend.user.application.port.out.GetUserByIdRepository;
import com.sgdis.backend.user.application.port.out.GetUserByUsernameRepository;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class JpaUserRepository implements GetUserByIdRepository, GetUserByUsernameRepository {

    private final SpringDataUserRepository repository;

    @Override
    public User findUserById(Long id) {
        return repository.findById(id)
                .map(UserMapper::toDomain)
                .orElseThrow(()->new ResourceNotFoundException("No user found with id " + id));
    }

    @Override
    public User findUserByUsername(String username) {
        return repository.findByUsername(username)
                .map(UserMapper::toDomain)
                .orElseThrow(()->new ResourceNotFoundException("No user found with username " + username));
    }
}

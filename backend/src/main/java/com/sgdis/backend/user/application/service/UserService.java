package com.sgdis.backend.user.application.service;


import com.sgdis.backend.user.application.dto.CreateUserRequest;
import com.sgdis.backend.user.application.dto.UpdateUserRequest;
import com.sgdis.backend.user.application.dto.UserResponse;
import com.sgdis.backend.user.application.port.in.*;
import com.sgdis.backend.user.application.port.out.*;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService implements ListUserUseCase,GetUserByIdUseCase,CreateUserUseCase,UpdateUserUseCase, DeleteUserUseCase {

    private final CreateUserRepository createUserRepository;
    private final UpdateUserRepository updateUserRepository;
    private final DeleteUserRepository deleteUserRepository;
    private final ListUserRepository listUserRepository;
    private final GetUserByIdRepository getUserByIdRepository;
    private final SpringDataUserRepository springDataUserRepository;
    private final PasswordEncoder passwordEncoder;


    @Override
    public UserResponse getUserById(Long id) {
        return UserMapper.toResponse(getUserByIdRepository.findUserById(id));
    }

    @Override
    public List<UserResponse> listUsers(){
        return  listUserRepository.findAll()
                .stream()
                .map(UserMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponse createUser(CreateUserRequest createUserRequest) {
        User user = UserMapper.toDomain(createUserRequest);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User saved = createUserRepository.createUser(user);
        return UserMapper.toResponse(saved);
    }

    @Override
    public UserResponse updateUser(Long id, UpdateUserRequest updateUserRequest) {
        // Get existing user to preserve current data
        User existingUser = getUserByIdRepository.findUserById(id);

        User user = UserMapper.toDomain(updateUserRequest,id);

        // Preserve existing password if new password is not provided
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            user.setPassword(existingUser.getPassword());
        } else {
            // Hash password only if it's being updated
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        // Preserve existing image URL if not being updated
        if (user.getImgUrl() == null) {
            user.setImgUrl(existingUser.getImgUrl());
        }

        // Preserve other existing data if not provided
        if (user.getJobTitle() == null) {
            user.setJobTitle(existingUser.getJobTitle());
        }

        if (user.getLaborDepartment() == null) {
            user.setLaborDepartment(existingUser.getLaborDepartment());
        }

        User updated = updateUserRepository.updateUser(user);
        return UserMapper.toResponse(updated);
    }

    @Override
    public UserResponse deleteUser(Long id) {
        User user = getUserByIdRepository.findUserById(id);
        deleteUserRepository.deleteById(id);
        return UserMapper.toResponse(user);
    }

}

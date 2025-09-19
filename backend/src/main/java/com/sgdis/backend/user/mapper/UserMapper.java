package com.sgdis.backend.user.mapper;

import com.sgdis.backend.user.application.dto.CreateUserRequest;
import com.sgdis.backend.user.application.dto.UpdateUserRequest;
import com.sgdis.backend.user.application.dto.UserResponse;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;

public final class UserMapper {

    private UserMapper() {}

    public static User toDomain(UserEntity entity) {
        return new User(
                entity.getId(),
                entity.getUsername(),
                entity.getPassword(),
                entity.getEmail(),
                entity.getRole(),
                entity.isStatus()
        );
    }

    public static UserEntity toEntity(User user) {
        return UserEntity.builder()
                .id(user.getId())
                .username(user.getUsername())
                .password(user.getPassword())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.isStatus())
                .build();
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    public static User toDomain(CreateUserRequest request) {
        return new User(
                null,
                request.username(),
                null, // password will be set later
                request.email(),
                Role.valueOf(request.role().toUpperCase()),
                true
        );
    }

    public static User toDomain(UpdateUserRequest request, Long id) {
        return new User(
                id,
                request.username(),
                null, // password not updated here
                request.email(),
                Role.valueOf(request.role().toUpperCase()),
                true
        );
    }
}

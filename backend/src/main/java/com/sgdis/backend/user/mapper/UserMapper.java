package com.sgdis.backend.user.mapper;

import com.sgdis.backend.user.application.dto.CreateUserRequest;
import com.sgdis.backend.user.application.dto.UpdateUserRequest;
import com.sgdis.backend.user.application.dto.UserResponse;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;

import java.util.List;

public final class UserMapper {

    private UserMapper() {}

    public static User toDomain(UserEntity entity) {
        return new User(
                entity.getId(),
                entity.getPassword(),
                entity.getEmail(),
                entity.getFullName(),
                entity.getJobTitle(),
                entity.getLaborDepartment(),
                entity.getImgUrl(),
                entity.getRole(),
                entity.isStatus()
        );
    }

    public static UserEntity toEntity(User user) {
        return UserEntity.builder()
                .id(user.getId())
                .password(user.getPassword())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .jobTitle(user.getJobTitle())
                .laborDepartment(user.getLaborDepartment())
                .imgUrl(user.getImgUrl())
                .role(user.getRole())
                .status(user.isStatus())
                .build();
    }

    public static List<UserEntity> toEntityList(List<User> list) {
        return list.stream().map(UserMapper::toEntity).toList();
    }

    public static List<User> toDomainList(List<UserEntity> list) {
        return list.stream().map(UserMapper::toDomain).toList();
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getJobTitle(),
                user.getLaborDepartment(),
                user.getImgUrl(),
                user.getRole().name(),
                user.isStatus()
        );
    }

    public static User toDomain(CreateUserRequest request) {
        return new User(
                null,
                null,
                request.email(),
                null,
                null,
                null,
                null,
                Role.valueOf(request.role().toUpperCase()),
                true
        );
    }

    public static User toDomain(UpdateUserRequest request, Long id) {
        return new User(
                id,
                null,
                request.email(),
                null,
                null,
                null,
                null,
                Role.valueOf(request.role().toUpperCase()),
                true
        );
    }
}

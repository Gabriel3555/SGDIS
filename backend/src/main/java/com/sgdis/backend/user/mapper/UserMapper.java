package com.sgdis.backend.user.mapper;

import com.sgdis.backend.user.application.dto.CreateUserRequest;
import com.sgdis.backend.user.application.dto.UpdateUserRequest;
import com.sgdis.backend.user.application.dto.UserResponse;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;

import java.util.List;

public final class UserMapper {

    private UserMapper() {}

    public static UserResponse toResponse(UserEntity entity) {
        return new UserResponse(
                entity.getId(),
                entity.getEmail(),
                entity.getFullName(),
                entity.getJobTitle(),
                entity.getLaborDepartment(),
                entity.getImgUrl(),
                entity.getRole().name(),
                entity.isStatus(),
                entity.getRegionals()
        );
    }

    public static List<UserResponse> toResponseList(List<UserEntity> entities) {
        return entities.stream().map(UserMapper::toResponse).toList();
    }

    public static UserEntity fromCreateRequest(CreateUserRequest request) {
        return UserEntity.builder()
                .password(request.password())
                .email(request.email())
                .fullName(request.fullName())
                .jobTitle(request.jobTitle())
                .laborDepartment(request.laborDepartment())
                .role(Role.valueOf(request.role().toUpperCase()))
                .status(request.status())
                .build();
    }

    public static UserEntity fromUpdateRequest(UpdateUserRequest request, Long id) {
        return UserEntity.builder()
                .id(id)
                .password(request.password())
                .email(request.email())
                .fullName(request.fullName())
                .role(Role.valueOf(request.role().toUpperCase()))
                .status(request.status())
                .build();
    }

    public static UserEntity toEntityShallow(UserEntity entity) {
        if (entity == null) return null;
        return UserEntity.builder()
                .id(entity.getId())
                .password(entity.getPassword())
                .email(entity.getEmail())
                .fullName(entity.getFullName())
                .jobTitle(entity.getJobTitle())
                .laborDepartment(entity.getLaborDepartment())
                .imgUrl(entity.getImgUrl())
                .role(entity.getRole())
                .status(entity.isStatus())
                .inventories(null)
                .build();
    }

}
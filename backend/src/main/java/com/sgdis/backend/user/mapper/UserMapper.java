package com.sgdis.backend.user.mapper;

import com.sgdis.backend.inventory.mapper.InventoryMapper;
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
                entity.isStatus(),
                entity.getInventories() != null
                        ? entity.getInventories().stream()
                        .map(InventoryMapper::toDomainShallow)
                        .toList()
                        : null,
                entity.getRegionals()
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
                // USAR SHALLOW para evitar que InventoryMapper vuelva a mapear owner -> user -> ...
                .inventories(user.getInventories() != null
                        ? user.getInventories().stream()
                        .map(InventoryMapper::toEntityShallow)
                        .toList()
                        : null)
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
                user.isStatus(),
                user.getRegionals()
        );
    }

    public static User toDomain(CreateUserRequest request) {
        return new User(
                null,
                request.password(),
                request.email(),
                request.fullName(),
                request.jobTitle(),
                request.laborDepartment(),
                null,
                Role.valueOf(request.role().toUpperCase()),
                request.status(),
                null,  // Los nuevos usuarios no tienen inventarios asignados inicialmente
                null
        );
    }

    public static User toDomain(UpdateUserRequest request, Long id) {
        return new User(
                id,
                request.password(),
                request.email(),
                request.fullName(),
                null,
                null,
                null,
                Role.valueOf(request.role().toUpperCase()),
                request.status(),
                null,  // Al actualizar, se mantienen los inventarios existentes
                null
        );
    }

    public static User toDomainShallow(UserEntity entity) {
        if (entity == null) return null;
        return new User(
                entity.getId(),
                null, // password
                entity.getEmail(),
                entity.getFullName(),
                entity.getJobTitle(),
                entity.getLaborDepartment(),
                entity.getImgUrl(),
                entity.getRole(),
                entity.isStatus(),
                null, // inventories NO mapeados
                null
        );
    }

    public static UserEntity toEntityShallow(User user) {
        if (user == null) return null;
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
                .inventories(null) // NO mapeamos inventories
                .build();
    }

}
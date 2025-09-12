package com.sgdis.backend.auth.mapper;

import com.sgdis.backend.auth.domain.User;
import com.sgdis.backend.auth.infrastructure.entity.UserEntity;

public final class UserMapper {

    private UserMapper() {}

    public static User toDomain(UserEntity entity) {
        return new User(
                entity.getId(),
                entity.getUsername(),
                entity.getPassword(),
                entity.getEmail(),
                entity.getRole()
        );
    }

    public static UserEntity toEntity(User user) {
        return UserEntity.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }

}

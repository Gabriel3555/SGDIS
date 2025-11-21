package com.sgdis.backend.inventory.mapper;

import com.sgdis.backend.inventory.application.dto.*;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.user.mapper.UserMapper;

import java.util.UUID;

public class InventoryMapper {

    public static InventoryEntity fromCreateRequest(CreateInventoryRequest request) {
        return InventoryEntity.builder()
                .uuid(UUID.randomUUID())
                .name(request.name())
                .location(request.location())
                .status(true)
                .build();
    }

    public static CreateInventoryResponse toCreateResponse(InventoryEntity entity) {
        return new CreateInventoryResponse(
                entity.getId(),
                entity.getUuid(),
                entity.getName(),
                entity.getLocation(),
                entity.getImgUrl(),
                entity.getOwner() != null ? UserMapper.toResponse(entity.getOwner()) : null
        );
    }

    public static InventoryResponse toResponse(InventoryEntity entity) {
        return new InventoryResponse(
                entity.getId(),
                entity.getUuid(),
                entity.getLocation(),
                entity.getName(),
                entity.getOwner() != null
                        ? UserMapper.toResponse(entity.getOwner())
                        : null,
                entity.getItems() != null ? (long) entity.getItems().size() : null,
                entity.getImgUrl(),
                entity.isStatus()
        );
    }

    public static InventoryEntity fromUpdateRequest(UpdateInventoryRequest request, InventoryEntity entity) {
        entity.setUuid(UUID.randomUUID());
        entity.setName(request.name());
        entity.setLocation(request.location());
        if (request.status() != null) {
            entity.setStatus(request.status());
        }
        return entity;
    }

    public static UpdateInventoryResponse toUpdateResponse(InventoryEntity entity) {
        return new UpdateInventoryResponse(
                entity.getId(),
                entity.getUuid(),
                entity.getName(),
                entity.getLocation(),
                entity.getImgUrl(),
                entity.isStatus()
        );
    }

}

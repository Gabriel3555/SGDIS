package com.sgdis.backend.inventory.mapper;

import com.sgdis.backend.inventory.application.dto.*;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.user.mapper.UserMapper;

import java.util.UUID;

public class InventoryMapper {

    public static InventoryEntity fromCreateRequest(CreateInventoryRequest request) {
        boolean status = request.status() == null ? true : request.status();
        return InventoryEntity.builder()
                .uuid(UUID.randomUUID())
                .name(request.name())
                .location(request.location())
                .status(status)
                .build();
    }

    public static CreateInventoryResponse toCreateResponse(InventoryEntity entity) {
        return new CreateInventoryResponse(
                entity.getId(),
                entity.getUuid(),
                entity.getName(),
                entity.getLocation(),
                entity.getImgUrl(),
                entity.isStatus()
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

    public static AssignedInventoryResponse toAssignedResponse(InventoryEntity entity) {
        AssignedInventoryUserResponse userResponse = null;
        if (entity.getOwner() != null) {
            var user = entity.getOwner();
            userResponse = new AssignedInventoryUserResponse(
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

        return new AssignedInventoryResponse(
                entity.getId(),
                entity.getUuid(),
                entity.getName(),
                entity.getLocation(),
                userResponse,
                entity.isStatus()
        );
    }

}

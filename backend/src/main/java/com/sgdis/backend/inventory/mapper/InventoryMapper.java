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
                .build();
    }

    public static CreateInventoryResponse toCreateResponse(InventoryEntity entity) {
        return new CreateInventoryResponse(
                entity.getId(),
                entity.getUuid(),
                entity.getName(),
                entity.getLocation(),
                entity.getImgUrl()
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
                entity.getImgUrl()
        );
    }

    public static InventoryEntity fromUpdateRequest(UpdateInventoryRequest request, Long id) {
        return InventoryEntity.builder()
                .id(id)
                .uuid(UUID.randomUUID())
                .name(request.name())
                .location(request.location())
                .build();
    }

    public static UpdateInventoryResponse toUpdateResponse(InventoryEntity entity) {
        return new UpdateInventoryResponse(
                entity.getId(),
                entity.getUuid(),
                entity.getName(),
                entity.getLocation(),
                entity.getImgUrl()
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
                userResponse
        );
    }

}

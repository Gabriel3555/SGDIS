package com.sgdis.backend.inventory.mapper;

import com.sgdis.backend.inventory.application.dto.*;
import com.sgdis.backend.inventory.domain.Inventory;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.user.mapper.UserMapper;

import java.util.UUID;

public class InventoryMapper {

    public static Inventory toDomain(CreateInventoryRequest request) {
        Inventory inventory = new Inventory();
        inventory.setUuid(UUID.randomUUID());
        inventory.setName(request.name());
        inventory.setLocation(request.location());
        return inventory;
    }

    // Para cuando creas un inventario
    public static CreateInventoryResponse toCreateResponse(Inventory inventory) {
        return new CreateInventoryResponse(
                inventory.getId(),
                inventory.getUuid(),
                inventory.getName(),
                inventory.getLocation()
        );
    }

    // Para cuando lo devuelves en listados o consultas
    public static InventoryResponse toResponse(Inventory inventory) {
        return new InventoryResponse(
                inventory.getId(),
                inventory.getUuid(),
                inventory.getLocation(),
                inventory.getName(),
                inventory.getOwner()
        );
    }

    public static InventoryEntity toEntity(Inventory inventory) {
        return new InventoryEntity(
                inventory.getId(),
                inventory.getUuid(),
                inventory.getLocation(),
                inventory.getName(),
                inventory.getOwner() != null ? UserMapper.toEntity(inventory.getOwner()) : null
        );
    }

    public static Inventory toDomain(InventoryEntity entity) {
        return new Inventory(
                entity.getId(),
                entity.getUuid(),
                entity.getLocation(),
                entity.getName(),
                entity.getOwner() != null ? UserMapper.toDomain(entity.getOwner()) : null
        );
    }

    public static Inventory toDomain(UpdateInventoryRequest request, Long id) {
        Inventory inventory = new Inventory();
        inventory.setId(id);
        inventory.setUuid(UUID.randomUUID());
        inventory.setName(request.name());
        inventory.setLocation(request.location());
        return inventory;
    }

    public static UpdateInventoryResponse toUpdateResponse(Inventory inventory) {
        return new UpdateInventoryResponse(
                inventory.getId(),
                inventory.getUuid(),
                inventory.getName(),
                inventory.getLocation()
        );
    }

    public static AssignedInventoryResponse toAssignedResponse(Inventory inventory) {
        AssignedInventoryUserResponse userResponse = null;
        if (inventory.getOwner() != null) {
            var user = inventory.getOwner();
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
                inventory.getId(),
                inventory.getUuid(),
                inventory.getName(),
                inventory.getLocation(),
                userResponse
        );
    }


}

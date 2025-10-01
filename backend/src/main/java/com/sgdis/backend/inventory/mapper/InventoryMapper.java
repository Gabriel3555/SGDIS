package com.sgdis.backend.inventory.mapper;

import com.sgdis.backend.inventory.application.dto.*;
import com.sgdis.backend.inventory.domain.Inventory;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;

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
                inventory.getName(),
                inventory.getLocation(),
                null
        );
    }

    public static InventoryEntity toEntity(Inventory inventory) {
        return new InventoryEntity(
                inventory.getId(),
                inventory.getUuid(),
                inventory.getLocation(),
                inventory.getName(),
                null
        );
    }

    public static Inventory toDomain(InventoryEntity entity) {
        return new Inventory(
                entity.getId(),
                entity.getUuid(),
                entity.getLocation(),
                entity.getName(),
                null
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
}

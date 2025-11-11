package com.sgdis.backend.inventory.application.dto;

import com.sgdis.backend.user.application.dto.UserResponseWithoutRegionals;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;

import java.util.UUID;

public record InventoryResponse(
        Long id,
        UUID uuid,
        String location,
        String name,
        UserResponseWithoutRegionals owner
        //Institucion institucion
) {}

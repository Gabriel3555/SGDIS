package com.sgdis.backend.inventory.application.dto;

import com.sgdis.backend.user.domain.User;

import java.util.UUID;

public record InventoryResponse(
        Long id,
        UUID uuid,
        String location,
        String name,
        User owner
        //Institucion institucion
) {}

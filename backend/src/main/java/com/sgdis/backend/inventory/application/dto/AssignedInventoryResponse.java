package com.sgdis.backend.inventory.application.dto;

import com.sgdis.backend.user.domain.User;

import java.util.UUID;

public record AssignedInventoryResponse(
        Long id,
        UUID uuid,
        String name,
        String location,
        AssignedInventoryUserResponse user
) {}

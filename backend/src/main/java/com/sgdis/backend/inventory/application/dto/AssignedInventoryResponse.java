package com.sgdis.backend.inventory.application.dto;


import java.util.UUID;

public record AssignedInventoryResponse(
        Long id,
        UUID uuid,
        String name,
        String location,
        AssignedInventoryUserResponse user,
        Boolean status
) {}

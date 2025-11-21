package com.sgdis.backend.user.application.dto;

import java.util.UUID;

public record ManagedInventoryResponse(
        Long id,
        UUID uuid,
        String name,
        String location,
        Long ownerId,
        String ownerName,
        String ownerEmail,
        Boolean status
) {}
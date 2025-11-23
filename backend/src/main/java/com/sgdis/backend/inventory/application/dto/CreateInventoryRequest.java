package com.sgdis.backend.inventory.application.dto;

import jakarta.validation.constraints.NotNull;

public record CreateInventoryRequest(
    String location,
    String name,
    Long ownerId,
    @NotNull Long institutionId
) {}

package com.sgdis.backend.inventory.application.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateInventoryRequest(
    String location,
    String name,
    Long ownerId
) {}

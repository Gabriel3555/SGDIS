package com.sgdis.backend.inventory.application.dto;


public record AssignedInventoryRequest(
        Long inventoryId,
        Long userId
) {}

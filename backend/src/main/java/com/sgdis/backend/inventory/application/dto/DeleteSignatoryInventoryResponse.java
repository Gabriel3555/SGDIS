package com.sgdis.backend.inventory.application.dto;

public record DeleteSignatoryInventoryResponse(
        Long userId,
        String fullName,
        String email,
        Long inventoryId,
        String inventoryName,
        String message,
        Boolean status
) {}
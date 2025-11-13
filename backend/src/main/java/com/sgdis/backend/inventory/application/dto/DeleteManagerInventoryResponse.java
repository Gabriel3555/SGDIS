package com.sgdis.backend.inventory.application.dto;

public record DeleteManagerInventoryResponse(
        Long managerId,
        String managerName,
        String managerEmail,
        Long inventoryId,
        String inventoryName,
        String message,
        boolean success
) {
}
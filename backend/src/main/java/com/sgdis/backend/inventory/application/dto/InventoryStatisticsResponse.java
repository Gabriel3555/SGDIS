package com.sgdis.backend.inventory.application.dto;

public record InventoryStatisticsResponse(
        Long totalItems,
        Double totalValue
) {
}


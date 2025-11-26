package com.sgdis.backend.inventory.application.dto;

import lombok.Builder;

@Builder
public record GeneralInventoryStatisticsResponse(
        Long totalInventories,
        Long activeInventories,
        Long inactiveInventories,
        Long totalItems,
        Double totalValue
) {}


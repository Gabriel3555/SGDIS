package com.sgdis.backend.user.application.dto;

import lombok.Builder;

@Builder
public record WarehouseStatisticsResponse(
        // User statistics
        Long totalUsers,
        Long warehouseManagersCount,
        Long systemUsersCount,
        
        // Inventory statistics
        Long totalInventories,
        Long activeInventories,
        Long inactiveInventories,
        Long totalItems,
        Double totalValue
) {}


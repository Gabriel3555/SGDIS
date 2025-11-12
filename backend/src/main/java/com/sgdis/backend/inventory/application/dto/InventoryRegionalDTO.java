package com.sgdis.backend.inventory.application.dto;

import com.sgdis.backend.data.regional.entity.RegionalEntity;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;

public record InventoryRegionalDTO(
        RegionalEntity regional,
        InventoryEntity inventory
) {
}

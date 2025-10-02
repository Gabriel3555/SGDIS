package com.sgdis.backend.inventory.application.dto;

import com.sgdis.backend.inventory.domain.Inventory;
import com.sgdis.backend.user.domain.User;

public record AssignedInventoryRequest(
        Long inventoryId,
        Long userId
) {}

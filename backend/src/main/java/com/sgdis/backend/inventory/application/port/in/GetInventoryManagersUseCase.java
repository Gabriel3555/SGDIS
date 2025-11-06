package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.user.application.dto.InventoryManagerResponse;

import java.util.List;

public interface GetInventoryManagersUseCase {
    List<InventoryManagerResponse> getInventoryManagers(Long inventoryId);
}
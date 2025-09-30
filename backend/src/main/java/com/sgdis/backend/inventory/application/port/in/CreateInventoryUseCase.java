package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.CreateInventoryRequest;

public interface CreateInventoryUseCase {
    CreateInventoryRequest createInventory(CreateInventoryRequest inventoryRequest);
}

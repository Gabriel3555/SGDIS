package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.CreateInventoryRequest;
import com.sgdis.backend.inventory.application.dto.CreateInventoryResponse;

public interface CreateInventoryUseCase {
    CreateInventoryResponse createInventory(CreateInventoryRequest request);
}

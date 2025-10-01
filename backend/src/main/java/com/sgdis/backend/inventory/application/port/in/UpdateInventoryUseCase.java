package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.UpdateInventoryRequest;
import com.sgdis.backend.inventory.application.dto.UpdateInventoryResponse;

public interface UpdateInventoryUseCase {
    UpdateInventoryResponse updateInventory(Long id,UpdateInventoryRequest request);
}

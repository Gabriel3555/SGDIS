package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.InventoryResponse;
import com.sgdis.backend.inventory.application.dto.UpdateInventoryOwnerRequest;

public interface UpdateInventoryOwnerUseCase {
    InventoryResponse updateInventoryOwner(Long inventoryId, UpdateInventoryOwnerRequest request);
}






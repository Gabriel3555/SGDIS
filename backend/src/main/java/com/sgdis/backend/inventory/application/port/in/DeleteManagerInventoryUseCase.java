package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.DeleteManagerInventoryRequest;
import com.sgdis.backend.inventory.application.dto.DeleteManagerInventoryResponse;

public interface DeleteManagerInventoryUseCase {
    DeleteManagerInventoryResponse deleteManagerInventory(DeleteManagerInventoryRequest request);
}

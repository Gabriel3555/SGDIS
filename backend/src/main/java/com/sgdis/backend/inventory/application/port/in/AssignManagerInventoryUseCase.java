package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.AssignManagerInventoryRequest;
import com.sgdis.backend.inventory.application.dto.AssignManagerInventoryResponse;

public interface AssignManagerInventoryUseCase {
    AssignManagerInventoryResponse assignManagerInventory(AssignManagerInventoryRequest request);
}

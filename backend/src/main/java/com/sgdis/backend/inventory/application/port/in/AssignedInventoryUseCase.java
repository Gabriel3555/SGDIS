package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.AssignedInventoryRequest;
import com.sgdis.backend.inventory.application.dto.AssignedInventoryResponse;

//Asignar inventario
public interface AssignedInventoryUseCase {
    AssignedInventoryResponse assignedInventory(AssignedInventoryRequest request);
}

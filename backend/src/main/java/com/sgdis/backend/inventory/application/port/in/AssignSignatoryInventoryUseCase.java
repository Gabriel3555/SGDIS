package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.AssignSignatoryInventoryRequest;
import com.sgdis.backend.inventory.application.dto.AssignSignatoryInventoryResponse;

public interface AssignSignatoryInventoryUseCase {
    AssignSignatoryInventoryResponse assignSignatoryInventory(AssignSignatoryInventoryRequest request);
}
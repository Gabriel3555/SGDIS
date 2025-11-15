package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.DeleteSignatoryInventoryRequest;
import com.sgdis.backend.inventory.application.dto.DeleteSignatoryInventoryResponse;

public interface DeleteSignatoryInventoryUseCase {
    DeleteSignatoryInventoryResponse deleteSignatoryInventory(DeleteSignatoryInventoryRequest request);
}
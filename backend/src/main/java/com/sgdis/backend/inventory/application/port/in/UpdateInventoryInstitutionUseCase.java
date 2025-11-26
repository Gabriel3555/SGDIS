package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.InventoryResponse;
import com.sgdis.backend.inventory.application.dto.UpdateInventoryInstitutionRequest;

public interface UpdateInventoryInstitutionUseCase {

    InventoryResponse updateInventoryInstitution(Long inventoryId, UpdateInventoryInstitutionRequest request);
}





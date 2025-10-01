package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.InventoryResponse;

public interface GetInventoryByIdUseCase {
    InventoryResponse getInventoryById(Long id);
}

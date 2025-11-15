package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.QuitInventoryResponse;

public interface QuitSignatoryInventoryUseCase {
    QuitInventoryResponse quitSignatoryInventory(Long inventoryId);
}
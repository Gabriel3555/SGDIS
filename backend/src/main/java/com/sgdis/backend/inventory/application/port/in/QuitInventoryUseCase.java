package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.InventoryResponse;
import com.sgdis.backend.inventory.application.dto.QuitInventoryResponse;

import java.awt.desktop.QuitResponse;

public interface QuitInventoryUseCase {
    QuitInventoryResponse quitInventory(Long inventoryId);
}

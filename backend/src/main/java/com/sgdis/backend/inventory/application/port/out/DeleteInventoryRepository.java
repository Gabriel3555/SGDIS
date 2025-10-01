package com.sgdis.backend.inventory.application.port.out;

import com.sgdis.backend.inventory.domain.Inventory;

public interface DeleteInventoryRepository {
    void deleteInventory(Long id);
}

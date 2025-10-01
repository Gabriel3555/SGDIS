package com.sgdis.backend.inventory.application.port.out;

import com.sgdis.backend.inventory.domain.Inventory;

public interface UpdateInventoryRepository {
    Inventory updateInventory(Inventory inventory);
}

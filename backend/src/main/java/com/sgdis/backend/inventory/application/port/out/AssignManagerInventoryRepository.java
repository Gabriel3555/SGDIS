package com.sgdis.backend.inventory.application.port.out;

import com.sgdis.backend.inventory.domain.Inventory;
import com.sgdis.backend.user.domain.User;

public interface AssignManagerInventoryRepository {
    Inventory assignManagerInventory(Inventory inventory, User user);
}

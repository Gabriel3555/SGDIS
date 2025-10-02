package com.sgdis.backend.inventory.application.port.out;

import com.sgdis.backend.inventory.domain.Inventory;

public interface AssignedInventoryRepository {
    //Asignar inventario
    Inventory asignedInventory(Inventory inventory);
}

package com.sgdis.backend.inventory.application.port.out;

import com.sgdis.backend.inventory.domain.Inventory;

import java.util.List;

public interface GetAllOwnedInventoriesRepository {
    List<Inventory> getAllOwnedInventories(Long ownerId);
}

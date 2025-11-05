package com.sgdis.backend.user.application.port.out;

import com.sgdis.backend.inventory.domain.Inventory;

import java.util.List;

public interface GetManagedInventoriesRepository {
    List<Inventory> findManagedInventoriesByUserId(Long userId);
}
package com.sgdis.backend.inventory.application.port.out;

import com.sgdis.backend.user.domain.User;

import java.util.List;

public interface GetInventoryManagersRepository {
    List<User> findManagersByInventoryId(Long inventoryId);
}
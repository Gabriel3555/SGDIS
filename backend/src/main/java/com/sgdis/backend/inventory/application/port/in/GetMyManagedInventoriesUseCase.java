package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.user.application.dto.ManagedInventoryResponse;

import java.util.List;

public interface GetMyManagedInventoriesUseCase {
    List<ManagedInventoryResponse> getMyManagedInventories();
}







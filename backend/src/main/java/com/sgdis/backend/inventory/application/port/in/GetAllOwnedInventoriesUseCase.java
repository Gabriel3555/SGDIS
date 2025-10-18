package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.GetAllOwnedInventoriesResponse;

public interface GetAllOwnedInventoriesUseCase {
    GetAllOwnedInventoriesResponse getAllOwnedInventories();
}

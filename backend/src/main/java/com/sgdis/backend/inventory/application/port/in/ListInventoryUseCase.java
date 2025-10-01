package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.InventoryResponse;

import java.util.List;

public interface ListInventoryUseCase {
    List<InventoryResponse> listInventoryes();
}

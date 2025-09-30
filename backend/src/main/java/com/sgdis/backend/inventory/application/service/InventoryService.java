package com.sgdis.backend.inventory.application.service;

import com.sgdis.backend.inventory.application.dto.CreateInventoryRequest;
import com.sgdis.backend.inventory.application.port.in.CreateInventoryUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InventoryService implements CreateInventoryUseCase {

    @Override
    public CreateInventoryRequest createInventory(CreateInventoryRequest inventoryRequest) {
        return null;
    }
}

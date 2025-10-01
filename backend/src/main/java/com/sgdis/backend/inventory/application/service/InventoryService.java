package com.sgdis.backend.inventory.application.service;

import com.sgdis.backend.inventory.application.dto.CreateInventoryRequest;
import com.sgdis.backend.inventory.application.dto.CreateInventoryResponse;
import com.sgdis.backend.inventory.application.port.in.CreateInventoryUseCase;
import com.sgdis.backend.inventory.application.port.out.CreateInventoryRepository;
import com.sgdis.backend.inventory.domain.Inventory;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryService implements CreateInventoryUseCase {

    private final CreateInventoryRepository createInventoryRepository;

    @Override
    public CreateInventoryResponse createInventory(CreateInventoryRequest request) {
        Inventory inventory = new Inventory();
        inventory.setUuid(UUID.randomUUID());
        inventory.setName(request.name());
        inventory.setLocation(request.location());

        Inventory savedInventory = createInventoryRepository.createInventory(inventory);

        return new CreateInventoryResponse(savedInventory.getId(),savedInventory.getUuid(),savedInventory.getName(),savedInventory.getLocation());
    }
}

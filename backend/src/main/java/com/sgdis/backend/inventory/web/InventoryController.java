package com.sgdis.backend.inventory.web;

import com.sgdis.backend.inventory.application.dto.CreateInventoryRequest;
import com.sgdis.backend.inventory.application.dto.CreateInventoryResponse;
import com.sgdis.backend.inventory.application.port.in.CreateInventoryUseCase;
import com.sgdis.backend.inventory.application.service.InventoryService;
import com.sgdis.backend.inventory.domain.Inventory;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final CreateInventoryUseCase createInventoryUseCase;

    @PostMapping
    public CreateInventoryResponse createInventory(@RequestBody CreateInventoryRequest request) {
        return createInventoryUseCase.createInventory(request);
    }

}

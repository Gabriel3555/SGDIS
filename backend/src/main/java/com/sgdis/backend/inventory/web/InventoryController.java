package com.sgdis.backend.inventory.web;

import com.sgdis.backend.inventory.application.dto.*;
import com.sgdis.backend.inventory.application.port.in.AssignManagerInventoryUseCase;
import com.sgdis.backend.inventory.application.port.in.*;
import com.sgdis.backend.inventory.application.service.InventoryService;
import com.sgdis.backend.inventory.domain.Inventory;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final CreateInventoryUseCase createInventoryUseCase;
    private final DeleteInventoryUseCase deleteInventoryUseCase;
    private final GetInventoryByIdUseCase getInventoryByIdUseCase;
    private final ListInventoryUseCase listInventoryUseCase;
    private final UpdateInventoryUseCase updateInventoryUseCase;
    private final AssignedInventoryUseCase assignedInventoryUseCase;
    private final AssignManagerInventoryUseCase assignManagerInventoryUseCase;
    private final GetAllOwnedInventoriesUseCase getAllOwnedInventoriesUseCase;

    @PostMapping
    public CreateInventoryResponse createInventory(@RequestBody CreateInventoryRequest request) {
        return createInventoryUseCase.createInventory(request);
    }

    @GetMapping("/{id}")
    //@PreAuthorize("hasRole('ADMIN')")
    public InventoryResponse getInventoryById(@PathVariable Long id) {
        return getInventoryByIdUseCase.getInventoryById(id);
    }

    @GetMapping()
    //@PreAuthorize("hasRole('ADMIN')")
    public List<InventoryResponse> listInventoryes() {
        return listInventoryUseCase.listInventoryes();
    }

    @PutMapping("/{id}")
    //@PreAuthorize("hasRole('ADMIN')")
    public UpdateInventoryResponse updateInventory(@PathVariable Long id, @RequestBody UpdateInventoryRequest request) {
        return  updateInventoryUseCase.updateInventory(id, request);
    }

    @DeleteMapping("/{id}")
    //@PreAuthorize("hasRole('ADMIN')")
    public InventoryResponse deleteInventoryById(@PathVariable Long id) {
        return deleteInventoryUseCase.deleteInventoryById(id);
    }

    @PostMapping("/assignedInventory")
    public AssignedInventoryResponse assignInventory(@RequestBody AssignedInventoryRequest request) {
        return assignedInventoryUseCase.assignedInventory(request);
    }

    @PostMapping("/assignManager")
    public AssignManagerInventoryResponse assignManager(@RequestBody AssignManagerInventoryRequest request) {
        return assignManagerInventoryUseCase.assignManagerInventory(request);
    }

    @GetMapping("/owned")
    public GetAllOwnedInventoriesResponse getAllOwnedInventories() {
        return getAllOwnedInventoriesUseCase.getAllOwnedInventories();
    }
}

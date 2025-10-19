package com.sgdis.backend.inventory.web;

import com.sgdis.backend.inventory.application.dto.*;
import com.sgdis.backend.inventory.application.port.in.AssignManagerInventoryUseCase;
import com.sgdis.backend.inventory.application.port.in.*;
import com.sgdis.backend.inventory.application.service.InventoryService;
import com.sgdis.backend.inventory.domain.Inventory;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/inventory")
@Tag(name = "Inventory", description = "Inventory management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class InventoryController {

    private final CreateInventoryUseCase createInventoryUseCase;
    private final DeleteInventoryUseCase deleteInventoryUseCase;
    private final GetInventoryByIdUseCase getInventoryByIdUseCase;
    private final ListInventoryUseCase listInventoryUseCase;
    private final UpdateInventoryUseCase updateInventoryUseCase;
    private final AssignedInventoryUseCase assignedInventoryUseCase;
    private final AssignManagerInventoryUseCase assignManagerInventoryUseCase;
    private final GetAllOwnedInventoriesUseCase getAllOwnedInventoriesUseCase;

    @Operation(
            summary = "Create new inventory",
            description = "Creates a new inventory item"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Inventory created successfully",
            content = @Content(schema = @Schema(implementation = CreateInventoryResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @PostMapping
    public CreateInventoryResponse createInventory(@RequestBody CreateInventoryRequest request) {
        return createInventoryUseCase.createInventory(request);
    }

    @Operation(
            summary = "Get inventory by ID",
            description = "Retrieves a specific inventory item by its ID"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Inventory found",
            content = @Content(schema = @Schema(implementation = InventoryResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Inventory not found")
    @GetMapping("/{id}")
    //@PreAuthorize("hasRole('ADMIN')")
    public InventoryResponse getInventoryById(@PathVariable Long id) {
        return getInventoryByIdUseCase.getInventoryById(id);
    }

    @Operation(
            summary = "List all inventories",
            description = "Retrieves all inventory items"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Inventories retrieved successfully",
            content = @Content(schema = @Schema(implementation = InventoryResponse.class))
    )
    @GetMapping()
    //@PreAuthorize("hasRole('ADMIN')")
    public List<InventoryResponse> listInventoryes() {
        return listInventoryUseCase.listInventoryes();
    }

    @Operation(
            summary = "Update inventory",
            description = "Updates an existing inventory item"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Inventory updated successfully",
            content = @Content(schema = @Schema(implementation = UpdateInventoryResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Inventory not found")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @PutMapping("/{id}")
    //@PreAuthorize("hasRole('ADMIN')")
    public UpdateInventoryResponse updateInventory(@PathVariable Long id, @RequestBody UpdateInventoryRequest request) {
        return  updateInventoryUseCase.updateInventory(id, request);
    }

    @Operation(
            summary = "Delete inventory",
            description = "Deletes an inventory item by its ID"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Inventory deleted successfully",
            content = @Content(schema = @Schema(implementation = InventoryResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Inventory not found")
    @DeleteMapping("/{id}")
    //@PreAuthorize("hasRole('ADMIN')")
    public InventoryResponse deleteInventoryById(@PathVariable Long id) {
        return deleteInventoryUseCase.deleteInventoryById(id);
    }

    @Operation(
            summary = "Assign inventory to user",
            description = "Assigns an inventory item to a specific user"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Inventory assigned successfully",
            content = @Content(schema = @Schema(implementation = AssignedInventoryResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @PostMapping("/assignedInventory")
    public AssignedInventoryResponse assignInventory(@RequestBody AssignedInventoryRequest request) {
        return assignedInventoryUseCase.assignedInventory(request);
    }

    @Operation(
            summary = "Assign manager to inventory",
            description = "Assigns a manager to an inventory item"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Manager assigned successfully",
            content = @Content(schema = @Schema(implementation = AssignManagerInventoryResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @PostMapping("/assignManager")
    public AssignManagerInventoryResponse assignManager(@RequestBody AssignManagerInventoryRequest request) {
        return assignManagerInventoryUseCase.assignManagerInventory(request);
    }

    @Operation(
            summary = "Get owned inventories",
            description = "Retrieves all inventories owned by the current user"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Owned inventories retrieved successfully",
            content = @Content(schema = @Schema(implementation = GetAllOwnedInventoriesResponse.class))
    )
    @GetMapping("/owned")
    public GetAllOwnedInventoriesResponse getAllOwnedInventories() {
        return getAllOwnedInventoriesUseCase.getAllOwnedInventories();
    }
}

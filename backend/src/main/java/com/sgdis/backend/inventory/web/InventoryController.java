package com.sgdis.backend.inventory.web;

import com.sgdis.backend.inventory.application.dto.*;
import com.sgdis.backend.inventory.application.port.in.AssignManagerInventoryUseCase;
import com.sgdis.backend.inventory.application.port.in.*;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.user.application.dto.InventoryManagerResponse;
import com.sgdis.backend.user.application.dto.ManagedInventoryResponse;
import com.sgdis.backend.user.application.service.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    private final FindMyInventoryUseCase findMyInventoryUseCase;
    private final QuitInventoryUseCase quitInventoryUseCase;
    private final AssignManagerInventoryUseCase assignManagerInventoryUseCase;
    private final DeleteManagerInventoryUseCase deleteManagerInventoryUseCase;
    private final GetInventoryManagersUseCase getInventoryManagersUseCase;
    private final GetAllManagedInventoriesUseCase getAllManagedInventoriesUseCase;
    private final SpringDataInventoryRepository inventoryRepository;
    private final AssignSignatoryInventoryUseCase assignSignatoryInventoryUseCase;
    private final GetMySignatoryInventoriesUseCase getMySignatoryInventoriesUseCase;
    private final QuitSignatoryInventoryUseCase quitSignatoryInventoryUseCase;
    private final DeleteSignatoryInventoryUseCase deleteSignatoryInventoryUseCase;
    private final GetAllSignatoriesUseCase getAllSignatoriesUseCase;
    private final FileUploadService fileUploadService;

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
    //@PreAuthorize("hasRole('ADMIN_INSTITUTION')")
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
    //@PreAuthorize("hasRole('ADMIN_INSTITUTION')")
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
    //@PreAuthorize("hasRole('ADMIN_INSTITUTION')")
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
    //@PreAuthorize("hasRole('ADMIN_INSTITUTION')")
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
            summary = "Delete manager from inventory",
            description = "Removes a manager from an inventory item"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Manager deleted successfully",
            content = @Content(schema = @Schema(implementation = DeleteManagerInventoryResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "404", description = "Manager not found in inventory")
    @DeleteMapping("/deleteManager")
    public DeleteManagerInventoryResponse deleteManager(@RequestBody DeleteManagerInventoryRequest request) {
        return deleteManagerInventoryUseCase.deleteManagerInventory(request);
    }

    @Operation(
            summary = "Get inventory managers",
            description = "Retrieves all managers of a specific inventory by its ID"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Managers retrieved successfully",
            content = @Content(schema = @Schema(implementation = InventoryManagerResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Inventory not found")
    @GetMapping("/{id}/managers")
    public List<InventoryManagerResponse> getInventoryManagers(@PathVariable Long id) {
        return getInventoryManagersUseCase.getInventoryManagers(id);
    }

    @Operation(
            summary = "Get all inventories managed by a user",
            description = "Retrieves all inventories managed by a specific user by their ID"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Managed inventories retrieved successfully",
            content = @Content(schema = @Schema(implementation = ManagedInventoryResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "User not found")
    @GetMapping("/managed/{userId}")
    //@PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    public List<ManagedInventoryResponse> getAllManagedInventories(@PathVariable Long userId) {
        return getAllManagedInventoriesUseCase.getAllManagedInventories(userId);
    }

    @GetMapping("/myInventory")
    public InventoryResponse getMyInventory() {
        return findMyInventoryUseCase.findMyInventory();
    }

    @PostMapping("/quitInventory/{inventoryId}")
    public QuitInventoryResponse quitInventory(@PathVariable Long inventoryId) {
        return quitInventoryUseCase.quitInventory(inventoryId);
    }

    @Operation(
            summary = "Upload inventory image",
            description = "Uploads an image for a specific inventory by its ID"
    )
    @ApiResponse(responseCode = "200", description = "Inventory image updated successfully")
    @ApiResponse(responseCode = "404", description = "Inventory not found")
    @ApiResponse(responseCode = "400", description = "Invalid file")
    @ApiResponse(responseCode = "403", description = "Access denied")
    @PostMapping("/{id}/image")
    public ResponseEntity<String> uploadInventoryImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            InventoryEntity inventory = inventoryRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + id));

            if (inventory.getImgUrl() != null) {
                fileUploadService.deleteFile(inventory.getImgUrl());
            }

            String imgUrl = fileUploadService.saveInventoryFile(file, inventory.getUuid().toString());
            inventory.setImgUrl(imgUrl);
            inventoryRepository.save(inventory);

            return ResponseEntity.ok("Inventory image updated successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error updating inventory image: " + e.getMessage());
        }
    }


    @Operation(
            summary = "Assign signatory to inventory",
            description = "Assigns a signatory to an inventory item"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Signatory assigned successfully",
            content = @Content(schema = @Schema(implementation = AssignSignatoryInventoryResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @PostMapping("/assignSignatory")
    public AssignSignatoryInventoryResponse assignSignatory(@RequestBody AssignSignatoryInventoryRequest request) {
        return assignSignatoryInventoryUseCase.assignSignatoryInventory(request);
    }

    @Operation(
            summary = "Delete signatory from inventory",
            description = "Removes a signatory from an inventory item"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Signatory deleted successfully",
            content = @Content(schema = @Schema(implementation = DeleteSignatoryInventoryResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "404", description = "Signatory not found in inventory")
    @DeleteMapping("/deleteSignatory")
    public DeleteSignatoryInventoryResponse deleteSignatory(@RequestBody DeleteSignatoryInventoryRequest request) {
        return deleteSignatoryInventoryUseCase.deleteSignatoryInventory(request);
    }


    @Operation(
            summary = "Get inventories where current user is signatory",
            description = "Retrieves all inventories where the authenticated user is a signatory"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Signatory inventories retrieved successfully",
            content = @Content(schema = @Schema(implementation = InventoryResponse.class))
    )
    @GetMapping("/mySignatoryInventories")
    public List<InventoryResponse> getMySignatoryInventories() {
        return getMySignatoryInventoriesUseCase.getMySignatoryInventories();
    }

    @Operation(
            summary = "Quit as signatory from inventory",
            description = "Allows the authenticated user to quit as a signatory from a specific inventory"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Successfully quit as signatory",
            content = @Content(schema = @Schema(implementation = QuitInventoryResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Inventory not found or user is not a signatory")
    @PostMapping("/quitSignatory/{inventoryId}")
    public QuitInventoryResponse quitSignatory(@PathVariable Long inventoryId) {
        return quitSignatoryInventoryUseCase.quitSignatoryInventory(inventoryId);
    }

    @Operation(
            summary = "Get all signatories for inventory",
            description = "Retrieves all signatories of a specific inventory by its ID"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Signatories retrieved successfully",
            content = @Content(schema = @Schema(implementation = GetAllSignatoriesResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Inventory not found")
    @GetMapping("/{id}/signatories")
    public GetAllSignatoriesResponse getAllSignatories(@PathVariable Long id) {
        return getAllSignatoriesUseCase.getAllSignatories(new GetAllSignatoriesRequest(id));
    }

}

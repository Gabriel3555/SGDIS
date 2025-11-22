package com.sgdis.backend.inventory.web;

import com.sgdis.backend.inventory.application.dto.*;
import com.sgdis.backend.inventory.application.port.in.AssignManagerInventoryUseCase;
import com.sgdis.backend.inventory.application.port.in.*;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.user.application.dto.InventoryManagerResponse;
import com.sgdis.backend.user.application.dto.ManagedInventoryResponse;
import com.sgdis.backend.user.application.service.FileUploadService;
import com.sgdis.backend.auth.application.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final UpdateInventoryOwnerUseCase updateInventoryOwnerUseCase;
    private final FindMyInventoryUseCase findMyInventoryUseCase;
    private final QuitInventoryUseCase quitInventoryUseCase;
    private final AssignManagerInventoryUseCase assignManagerInventoryUseCase;
    private final DeleteManagerInventoryUseCase deleteManagerInventoryUseCase;
    private final GetInventoryManagersUseCase getInventoryManagersUseCase;
    private final GetAllManagedInventoriesUseCase getAllManagedInventoriesUseCase;
    private final GetMyManagedInventoriesUseCase getMyManagedInventoriesUseCase;
    private final SpringDataInventoryRepository inventoryRepository;
    private final AssignSignatoryInventoryUseCase assignSignatoryInventoryUseCase;
    private final GetMySignatoryInventoriesUseCase getMySignatoryInventoriesUseCase;
    private final QuitSignatoryInventoryUseCase quitSignatoryInventoryUseCase;
    private final DeleteSignatoryInventoryUseCase deleteSignatoryInventoryUseCase;
    private final GetAllSignatoriesUseCase getAllSignatoriesUseCase;
    private final QuitManagerInventoryUseCase quitManagerInventoryUseCase;
    private final FileUploadService fileUploadService;
    private final AuthService authService;

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
            summary = "Change inventory owner",
            description = "Updates the owner assigned to an inventory"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Owner updated successfully",
            content = @Content(schema = @Schema(implementation = InventoryResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Inventory or user not found")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @PatchMapping("/{id}/owner")
    public InventoryResponse updateInventoryOwner(@PathVariable Long id, @RequestBody UpdateInventoryOwnerRequest request) {
        return updateInventoryOwnerUseCase.updateInventoryOwner(id, request);
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
    public InventoryResponse deleteInventoryById(@PathVariable Long id) {
        return deleteInventoryUseCase.deleteInventoryById(id);
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
    public List<ManagedInventoryResponse> getAllManagedInventories(@PathVariable Long userId) {
        return getAllManagedInventoriesUseCase.getAllManagedInventories(userId);
    }

    @Operation(
            summary = "Get inventories managed by the current user",
            description = "Retrieves all inventories where the authenticated user is assigned as manager"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Managed inventories retrieved successfully",
            content = @Content(schema = @Schema(implementation = ManagedInventoryResponse.class))
    )
    @GetMapping("/myManagedInventories")
    public List<ManagedInventoryResponse> getMyManagedInventories() {
        return getMyManagedInventoriesUseCase.getMyManagedInventories();
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
    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadInventoryImage(
            @PathVariable Long id,
            @Parameter(
                    description = "Imagen que se asociará al inventario",
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(type = "string", format = "binary")
                    )
            )
            @RequestParam("file") MultipartFile file) {
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
            summary = "Quit as manager from inventory",
            description = "Allows the authenticated user to quit as a manager from a specific inventory"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Successfully quit as manager",
            content = @Content(schema = @Schema(implementation = QuitInventoryResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Inventory not found or user is not a manager")
    @PostMapping("/quitManager/{inventoryId}")
    public QuitInventoryResponse quitManager(@PathVariable Long inventoryId) {
        return quitManagerInventoryUseCase.quitManagerInventory(inventoryId);
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

    @Operation(
            summary = "Get owner, managers and signatories of an inventory",
            description = "Retrieves the owner, all managers and all signatories of a specific inventory with their basic user information"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Users retrieved successfully",
            content = @Content(schema = @Schema(implementation = InventoryUsersResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Inventory not found")
    @GetMapping("/{id}/users")
    public ResponseEntity<InventoryUsersResponse> getInventoryUsers(@PathVariable Long id) {
        InventoryEntity inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + id));

        // Owner
        InventoryUserInfo owner = null;
        if (inventory.getOwner() != null) {
            owner = new InventoryUserInfo(
                    inventory.getOwner().getId(),
                    inventory.getOwner().getFullName(),
                    inventory.getOwner().getImgUrl() != null ? inventory.getOwner().getImgUrl() : ""
            );
        }

        // Managers
        List<InventoryUserInfo> managers = new java.util.ArrayList<>();
        if (inventory.getManagers() != null) {
            managers = inventory.getManagers().stream()
                    .map(user -> new InventoryUserInfo(
                            user.getId(),
                            user.getFullName(),
                            user.getImgUrl() != null ? user.getImgUrl() : ""
                    ))
                    .collect(java.util.stream.Collectors.toList());
        }

        // Signatories
        List<InventoryUserInfo> signatories = new java.util.ArrayList<>();
        if (inventory.getSignatories() != null) {
            signatories = inventory.getSignatories().stream()
                    .map(user -> new InventoryUserInfo(
                            user.getId(),
                            user.getFullName(),
                            user.getImgUrl() != null ? user.getImgUrl() : ""
                    ))
                    .collect(java.util.stream.Collectors.toList());
        }

        InventoryUsersResponse response = new InventoryUsersResponse(owner, managers, signatories);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Get all inventories (Superadmin only)",
            description = "Retrieves all paginated inventories. Only accessible by SUPERADMIN role."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Inventories retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "403", description = "Access denied - SUPERADMIN role required")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @GetMapping("/superAdminInventories")
    public Page<InventoryResponse> getSuperAdminInventories(
            @Parameter(description = "Page number (0-indexed)", required = false)
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", required = false)
            @RequestParam(defaultValue = "3") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<InventoryEntity> inventoryPage = inventoryRepository.findAll(pageable);
        return inventoryPage.map(InventoryMapper::toResponse);
    }

    @Operation(
            summary = "Get inventories from current user's regional",
            description = "Retrieves paginated inventories from all institutions in the current user's regional. " +
                    "The regional is obtained from the current user's institution."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Inventories retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "404", description = "User institution or regional not found")
    @GetMapping("/regionalAdminInventories")
    public Page<InventoryResponse> getRegionalAdminInventories(
            @Parameter(description = "Page number (0-indexed)", required = false)
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", required = false)
            @RequestParam(defaultValue = "3") int size
    ) {
        var currentUser = authService.getCurrentUser();
        if (currentUser.getInstitution() == null || currentUser.getInstitution().getRegional() == null) {
            throw new ResourceNotFoundException("User institution or regional not found");
        }
        Long regionalId = currentUser.getInstitution().getRegional().getId();
        
        Pageable pageable = PageRequest.of(page, size);
        Page<InventoryEntity> inventoryPage = inventoryRepository.findPageByRegionalId(regionalId, pageable);
        return inventoryPage.map(InventoryMapper::toResponse);
    }

    @Operation(
            summary = "Get inventories from a specific regional by ID",
            description = "Retrieves paginated inventories from all institutions in the specified regional."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Inventories retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "404", description = "Regional not found")
    @GetMapping("/regionalAdminInventories/{id}")
    public Page<InventoryResponse> getRegionalAdminInventoriesById(
            @Parameter(description = "Regional ID", required = true)
            @PathVariable Long id,
            @Parameter(description = "Page number (0-indexed)", required = false)
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", required = false)
            @RequestParam(defaultValue = "3") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<InventoryEntity> inventoryPage = inventoryRepository.findPageByRegionalId(id, pageable);
        return inventoryPage.map(InventoryMapper::toResponse);
    }

    @Operation(
            summary = "Get inventories from current user's institution",
            description = "Retrieves paginated inventories from the current user's institution."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Inventories retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "404", description = "User institution not found")
    @GetMapping("/institutionAdminInventories")
    public Page<InventoryResponse> getInstitutionAdminInventories(
            @Parameter(description = "Page number (0-indexed)", required = false)
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", required = false)
            @RequestParam(defaultValue = "3") int size
    ) {
        var currentUser = authService.getCurrentUser();
        if (currentUser.getInstitution() == null) {
            throw new ResourceNotFoundException("User institution not found");
        }
        Long institutionId = currentUser.getInstitution().getId();
        
        Pageable pageable = PageRequest.of(page, size);
        Page<InventoryEntity> inventoryPage = inventoryRepository.findPageByInstitutionId(institutionId, pageable);
        return inventoryPage.map(InventoryMapper::toResponse);
    }

    @Operation(
            summary = "Get inventories from a specific institution by ID",
            description = "Retrieves paginated inventories from the specified institution."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Inventories retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "404", description = "Institution not found")
    @GetMapping("/institutionAdminInventories/{id}")
    public Page<InventoryResponse> getInstitutionAdminInventoriesById(
            @Parameter(description = "Institution ID", required = true)
            @PathVariable Long id,
            @Parameter(description = "Page number (0-indexed)", required = false)
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", required = false)
            @RequestParam(defaultValue = "3") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<InventoryEntity> inventoryPage = inventoryRepository.findPageByInstitutionId(id, pageable);
        return inventoryPage.map(InventoryMapper::toResponse);
    }

    @Operation(
            summary = "Get inventories from a specific regional and institution",
            description = "Retrieves paginated inventories from a specific institution within a specific regional."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Inventories retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "404", description = "Regional or institution not found")
    @GetMapping("/regional/{regionalId}/institution/{institutionId}")
    public Page<InventoryResponse> getInventoriesByRegionalAndInstitution(
            @Parameter(description = "Regional ID", required = true)
            @PathVariable Long regionalId,
            @Parameter(description = "Institution ID", required = true)
            @PathVariable Long institutionId,
            @Parameter(description = "Page number (0-indexed)", required = false)
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", required = false)
            @RequestParam(defaultValue = "3") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<InventoryEntity> inventoryPage = inventoryRepository.findPageByRegionalIdAndInstitutionId(
                regionalId, institutionId, pageable);
        return inventoryPage.map(InventoryMapper::toResponse);
    }

}
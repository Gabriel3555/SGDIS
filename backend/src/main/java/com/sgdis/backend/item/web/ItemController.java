package com.sgdis.backend.item.web;

import com.sgdis.backend.item.application.dto.CreateItemRequest;
import com.sgdis.backend.item.application.dto.CreateItemResponse;
import com.sgdis.backend.item.application.dto.ItemDTO;
import com.sgdis.backend.item.application.dto.UpdateItemRequest;
import com.sgdis.backend.item.application.dto.UpdateItemResponse;
import com.sgdis.backend.item.application.port.CreateItemUseCase;
import com.sgdis.backend.item.application.port.GetItemsByInventoryAndCategoryUseCase;
import com.sgdis.backend.item.application.port.GetItemsByInventoryUseCase;
import com.sgdis.backend.item.application.port.UpdateItemUseCase;
import org.springframework.data.domain.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/items")
@Tag(name = "Item", description = "Item management endpoints")
public class ItemController {

    private final CreateItemUseCase createItemUseCase;
    private final UpdateItemUseCase updateItemUseCase;
    private final GetItemsByInventoryUseCase getItemsByInventoryUseCase;
    private final GetItemsByInventoryAndCategoryUseCase getItemsByInventoryAndCategoryUseCase;

    @Operation(
            summary = "Create new item",
            description = "Creates a new item",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = CreateItemRequest.class)
                    )
            )
    )
    @ApiResponse(
            responseCode = "201",
            description = "Item created successfully",
            content = @Content(schema = @Schema(implementation = CreateItemResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @PostMapping("/add")
    public ResponseEntity<CreateItemResponse> createItem(
            @RequestBody CreateItemRequest request
    ) {
        var response = createItemUseCase.createItem(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(
            summary = "Update item",
            description = "Updates an existing item",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = UpdateItemRequest.class)
                    )
            )
    )
    @ApiResponse(
            responseCode = "200",
            description = "Item updated successfully",
            content = @Content(schema = @Schema(implementation = UpdateItemResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Item not found")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @PutMapping("/{id}")
    public ResponseEntity<UpdateItemResponse> updateItem(
            @PathVariable Long id,
            @RequestBody UpdateItemRequest request
    ) {
        var updated = updateItemUseCase.updateItem(request);
        return ResponseEntity.ok(updated);
    }

    @Operation(
            summary = "Get items by inventory",
            description = "Retrieves paginated items from a specific inventory",
            parameters = {
                    @io.swagger.v3.oas.annotations.Parameter(
                            name = "inventoryId",
                            description = "ID of the inventory",
                            required = true,
                            in = io.swagger.v3.oas.annotations.enums.ParameterIn.PATH
                    ),
                    @io.swagger.v3.oas.annotations.Parameter(
                            name = "page",
                            description = "Page number (0-based)",
                            in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY
                    ),
                    @io.swagger.v3.oas.annotations.Parameter(
                            name = "size",
                            description = "Number of items per page",
                            in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY
                    )
            }
    )
    @ApiResponse(
            responseCode = "200",
            description = "Items retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "404", description = "Inventory not found")
    @GetMapping("/inventory/{inventoryId}")
    public ResponseEntity<Page<ItemDTO>> getItemsByInventory(
            @PathVariable Long inventoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        var items = getItemsByInventoryUseCase.getItemsByInventory(inventoryId, page, size);
        return ResponseEntity.ok(items);
    }

    @Operation(
            summary = "Get items by inventory and category",
            description = "Retrieves paginated items from a specific inventory and category",
            parameters = {
                    @io.swagger.v3.oas.annotations.Parameter(
                            name = "inventoryId",
                            description = "ID of the inventory",
                            required = true,
                            in = io.swagger.v3.oas.annotations.enums.ParameterIn.PATH
                    ),
                    @io.swagger.v3.oas.annotations.Parameter(
                            name = "categoryId",
                            description = "ID of the category",
                            required = true,
                            in = io.swagger.v3.oas.annotations.enums.ParameterIn.PATH
                    ),
                    @io.swagger.v3.oas.annotations.Parameter(
                            name = "page",
                            description = "Page number (0-based)",
                            in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY
                    ),
                    @io.swagger.v3.oas.annotations.Parameter(
                            name = "size",
                            description = "Number of items per page",
                            in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY
                    )
            }
    )
    @ApiResponse(
            responseCode = "200",
            description = "Items retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "404", description = "Inventory or category not found")
    @GetMapping("/inventory/{inventoryId}/category/{categoryId}")
    public ResponseEntity<Page<ItemDTO>> getItemsByInventoryAndCategory(
            @PathVariable Long inventoryId,
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        var items = getItemsByInventoryAndCategoryUseCase.getItemsByInventoryAndCategory(inventoryId, categoryId, page, size);
        return ResponseEntity.ok(items);
    }
}

package com.sgdis.backend.item.web;

import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.item.application.dto.CreateItemRequest;
import com.sgdis.backend.item.application.dto.CreateItemResponse;
import com.sgdis.backend.item.application.dto.ItemDTO;
import com.sgdis.backend.item.application.dto.UpdateItemRequest;
import com.sgdis.backend.item.application.dto.UpdateItemResponse;
import com.sgdis.backend.item.application.port.CreateItemUseCase;
import com.sgdis.backend.item.application.port.GetItemByLicencePlateNumberUseCase;
import com.sgdis.backend.item.application.port.GetItemBySerialUseCase;
import com.sgdis.backend.item.application.port.GetItemsByInventoryAndCategoryUseCase;
import com.sgdis.backend.item.application.port.GetItemsByInventoryUseCase;
import com.sgdis.backend.item.application.port.UpdateItemUseCase;
import com.sgdis.backend.verification.application.dto.VerificationResponse;
import com.sgdis.backend.verification.application.port.in.GetItemVerificationsUseCase;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.item.infrastructure.repository.SpringDataItemRepository;
import com.sgdis.backend.user.application.service.FileUploadService;
import org.springframework.data.domain.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/items")
@Tag(name = "Item", description = "Item management endpoints")
public class ItemController {

    private final CreateItemUseCase createItemUseCase;
    private final UpdateItemUseCase updateItemUseCase;
    private final GetItemsByInventoryUseCase getItemsByInventoryUseCase;
    private final GetItemsByInventoryAndCategoryUseCase getItemsByInventoryAndCategoryUseCase;
    private final GetItemByLicencePlateNumberUseCase getItemByLicencePlateNumberUseCase;
    private final GetItemBySerialUseCase getItemBySerialUseCase;
    private final GetItemVerificationsUseCase getItemVerificationsUseCase;
    private final SpringDataItemRepository itemRepository;
    private final FileUploadService fileUploadService;

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

    @Operation(
            summary = "Get item by licence plate number",
            description = "Retrieves a single item by its licence plate number",
            parameters = {
                    @io.swagger.v3.oas.annotations.Parameter(
                            name = "licencePlateNumber",
                            description = "Licence plate number of the item",
                            required = true,
                            in = io.swagger.v3.oas.annotations.enums.ParameterIn.PATH
                    )
            }
    )
    @ApiResponse(
            responseCode = "200",
            description = "Item retrieved successfully",
            content = @Content(schema = @Schema(implementation = ItemDTO.class))
    )
    @ApiResponse(responseCode = "404", description = "Item not found with the provided licence plate number")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @GetMapping("/licence-plate/{licencePlateNumber}")
    public ResponseEntity<ItemDTO> getItemByLicencePlateNumber(
            @PathVariable String licencePlateNumber
    ) {
        ItemDTO item = getItemByLicencePlateNumberUseCase.getItemByLicencePlateNumber(licencePlateNumber);
        return ResponseEntity.ok(item);
    }

    @Operation(
            summary = "Get item by serial number",
            description = "Retrieves a single item by its serial number (from the SERIAL attribute)",
            parameters = {
                    @io.swagger.v3.oas.annotations.Parameter(
                            name = "serial",
                            description = "Serial number of the item",
                            required = true,
                            in = io.swagger.v3.oas.annotations.enums.ParameterIn.PATH
                    )
            }
    )
    @ApiResponse(
            responseCode = "200",
            description = "Item retrieved successfully",
            content = @Content(schema = @Schema(implementation = ItemDTO.class))
    )
    @ApiResponse(responseCode = "404", description = "Item not found with the provided serial number")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @GetMapping("/serial/{serial}")
    public ResponseEntity<ItemDTO> getItemBySerial(
            @PathVariable String serial
    ) {
        ItemDTO item = getItemBySerialUseCase.getItemBySerial(serial);
        return ResponseEntity.ok(item);
    }

    @Operation(
            summary = "Get verifications for an item",
            description = "Retrieves paginated verifications for a specific item, ordered by most recent first",
            parameters = {
                    @io.swagger.v3.oas.annotations.Parameter(
                            name = "itemId",
                            description = "ID of the item",
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
                            description = "Number of verifications per page",
                            in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY
                    )
            }
    )
    @ApiResponse(
            responseCode = "200",
            description = "Verifications retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "404", description = "Item not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @GetMapping("/{itemId}/verifications")
    public ResponseEntity<Page<VerificationResponse>> getItemVerifications(
            @PathVariable Long itemId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<VerificationResponse> verifications = getItemVerificationsUseCase.getItemVerifications(itemId, page, size);
        return ResponseEntity.ok(verifications);
    }

    @Operation(
            summary = "Upload image for an item",
            description = "Uploads an image file for a specific item. The image will be added to the item's images list"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Image uploaded successfully"
    )
    @ApiResponse(responseCode = "404", description = "Item not found")
    @ApiResponse(responseCode = "400", description = "Invalid file")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @PostMapping(value = "/{itemId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadItemImage(
            @PathVariable Long itemId,
            @Parameter(
                    description = "Imagen que se asociará al ítem",
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(type = "string", format = "binary")
                    )
            )
            @RequestParam("file") MultipartFile file) {
        try {
            ItemEntity item = itemRepository.findById(itemId)
                    .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

            if (item.getUrlsImages() == null) {
                item.setUrlsImages(new ArrayList<>());
            }

            int imageIndex = item.getUrlsImages().size();
            String imageUrl = fileUploadService.saveItemImage(file, itemId, imageIndex);
            item.getUrlsImages().add(imageUrl);
            itemRepository.save(item);

            return ResponseEntity.ok("Image uploaded successfully");
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading image: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @Operation(
            summary = "Get all images for an item",
            description = "Retrieves all image URLs associated with a specific item"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Images retrieved successfully",
            content = @Content(schema = @Schema(implementation = List.class))
    )
    @ApiResponse(responseCode = "404", description = "Item not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @GetMapping("/{itemId}/images")
    public ResponseEntity<List<String>> getItemImages(@PathVariable Long itemId) {
        ItemEntity item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        List<String> images = item.getUrlsImages();
        if (images == null) {
            images = new ArrayList<>();
        }

        return ResponseEntity.ok(images);
    }

    @Operation(
            summary = "Delete an image from an item",
            description = "Deletes a specific image from an item by its URL path. Both the file and the URL reference will be removed."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Image deleted successfully"
    )
    @ApiResponse(responseCode = "404", description = "Item not found or image not found in item")
    @ApiResponse(responseCode = "400", description = "Invalid image URL")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @DeleteMapping("/{itemId}/image")
    public ResponseEntity<String> deleteItemImage(
            @PathVariable Long itemId,
            @RequestParam("imageUrl") String imageUrl) {
        try {
            ItemEntity item = itemRepository.findById(itemId)
                    .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

            if (item.getUrlsImages() == null || item.getUrlsImages().isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Item has no images");
            }

            if (!item.getUrlsImages().contains(imageUrl)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Image not found in item's image list");
            }

            // Remove from list
            item.getUrlsImages().remove(imageUrl);

            // Delete physical file
            try {
                fileUploadService.deleteFile(imageUrl);
            } catch (IOException e) {
                // Log error but continue with removing from database
                // The file might already be deleted or not exist
            }

            itemRepository.save(item);

            return ResponseEntity.ok("Image deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting image: " + e.getMessage());
        }
    }
}

package com.sgdis.backend.category.web;

import com.sgdis.backend.category.application.dto.CategoryDTO;
import com.sgdis.backend.category.application.dto.CreateCategoryRequest;
import com.sgdis.backend.category.application.dto.CreateCategoryResponse;
import com.sgdis.backend.category.application.dto.UpdateCategoryRequest;
import com.sgdis.backend.category.application.dto.UpdateCategoryResponse;
import com.sgdis.backend.category.application.port.CreateCategoryUseCase;
import com.sgdis.backend.category.application.port.UpdateCategoryUseCase;
import com.sgdis.backend.category.infrastructure.repository.SpringDataCategoryRepository;
import com.sgdis.backend.category.mapper.CategoryMapper;
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
@RequestMapping("/api/v1/categories")
@Tag(name = "Category", description = "Category management endpoints")
//@SecurityRequirement(name = "bearerAuth")
public class CategoryController {

    private final CreateCategoryUseCase createCategoryUseCase;
    private final UpdateCategoryUseCase updateCategoryUseCase;
    private final SpringDataCategoryRepository categoryRepository;

    // Crear category
    @Operation(
            summary = "Create new category",
            description = "Creates a new category",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = CreateCategoryRequest.class)
                    )
            )
    )
    @ApiResponse(
            responseCode = "201",
            description = "Category created successfully",
            content = @Content(schema = @Schema(implementation = CreateCategoryResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @PostMapping("/add")
    public ResponseEntity<CreateCategoryResponse> createCategory(
            @RequestBody CreateCategoryRequest request
    ) {
        var response = createCategoryUseCase.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Actualizar category
    @Operation(
            summary = "Update category",
            description = "Updates an existing category",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = UpdateCategoryRequest.class)
                    )
            )
    )
    @ApiResponse(
            responseCode = "200",
            description = "Category updated successfully",
            content = @Content(schema = @Schema(implementation = UpdateCategoryResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Category not found")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @PutMapping("/{id}")
    public ResponseEntity<UpdateCategoryResponse> updateCategory(
            @PathVariable Long id,
            @RequestBody UpdateCategoryRequest request
    ) {
        var updated = updateCategoryUseCase.updateCategory(request);
        return ResponseEntity.ok(updated);
    }

    // Obtener todas las categorías
    @Operation(
            summary = "Get all categories",
            description = "Retrieves all categories"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Categories retrieved successfully",
            content = @Content(schema = @Schema(implementation = CategoryDTO.class))
    )
    @GetMapping
    public ResponseEntity<java.util.List<CategoryDTO>> getAllCategories() {
        var categories = categoryRepository.findAll()
                .stream()
                .map(CategoryMapper::toDTO)
                .toList();
        return ResponseEntity.ok(categories);
    }
}
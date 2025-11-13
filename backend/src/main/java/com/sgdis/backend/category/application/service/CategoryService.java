package com.sgdis.backend.category.application.service;

import com.sgdis.backend.category.application.dto.CreateCategoryRequest;
import com.sgdis.backend.category.application.dto.CreateCategoryResponse;
import com.sgdis.backend.category.application.dto.UpdateCategoryRequest;
import com.sgdis.backend.category.application.dto.UpdateCategoryResponse;
import com.sgdis.backend.category.application.port.CreateCategoryUseCase;
import com.sgdis.backend.category.application.port.UpdateCategoryUseCase;
import com.sgdis.backend.category.infrastructure.entity.CategoryEntity;
import com.sgdis.backend.category.infrastructure.repository.SpringDataCategoryRepository;
import com.sgdis.backend.exception.DomainNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CategoryService implements
        CreateCategoryUseCase,
        UpdateCategoryUseCase {

    private final SpringDataCategoryRepository categoryRepository;

    @Override
    public CreateCategoryResponse createCategory(CreateCategoryRequest request) {
        CategoryEntity categoryEntity = CategoryEntity.builder()
                .name(request.name())
                .description(request.description())
                .build();

        CategoryEntity savedCategory = categoryRepository.save(categoryEntity);

        return new CreateCategoryResponse(
                savedCategory.getId(),
                savedCategory.getName(),
                savedCategory.getDescription(),
                "Category created successfully"
        );
    }

    @Override
    public UpdateCategoryResponse updateCategory(UpdateCategoryRequest request) {
        CategoryEntity existingCategory = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new DomainNotFoundException("Category not found with id: " + request.categoryId()));

        existingCategory.setName(request.name());
        existingCategory.setDescription(request.description());

        CategoryEntity updatedCategory = categoryRepository.save(existingCategory);

        return new UpdateCategoryResponse(
                updatedCategory.getId(),
                updatedCategory.getName(),
                updatedCategory.getDescription(),
                "Category updated successfully"
        );
    }
}
package com.sgdis.backend.category.mapper;

import com.sgdis.backend.category.application.dto.CategoryDTO;
import com.sgdis.backend.category.application.dto.CreateCategoryRequest;
import com.sgdis.backend.category.application.dto.UpdateCategoryRequest;
import com.sgdis.backend.category.infrastructure.entity.CategoryEntity;

public final class CategoryMapper {

    private CategoryMapper() {}

    public static CategoryEntity toEntity(CreateCategoryRequest request) {
        return CategoryEntity.builder()
                .name(request.name())
                .description(request.description())
                .build();
    }

    public static CategoryEntity toEntity(UpdateCategoryRequest request, CategoryEntity existingEntity) {
        existingEntity.setName(request.name());
        existingEntity.setDescription(request.description());
        return existingEntity;
    }

    public static CategoryDTO toDTO(CategoryEntity entity) {
        return new CategoryDTO(
                entity.getId(),
                entity.getName(),
                entity.getDescription()
        );
    }
}
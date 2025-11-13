package com.sgdis.backend.category.application.port;

import com.sgdis.backend.category.application.dto.UpdateCategoryRequest;
import com.sgdis.backend.category.application.dto.UpdateCategoryResponse;

public interface UpdateCategoryUseCase {
    UpdateCategoryResponse updateCategory(UpdateCategoryRequest request);
}
package com.sgdis.backend.category.application.port;

import com.sgdis.backend.category.application.dto.CreateCategoryRequest;
import com.sgdis.backend.category.application.dto.CreateCategoryResponse;

public interface CreateCategoryUseCase {
    CreateCategoryResponse createCategory(CreateCategoryRequest request);
}
package com.sgdis.backend.category.application.dto;

public record UpdateCategoryRequest(
    Long categoryId,
    String name,
    String description
) {}
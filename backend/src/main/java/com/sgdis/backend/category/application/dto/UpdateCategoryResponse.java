package com.sgdis.backend.category.application.dto;

public record UpdateCategoryResponse(
    Long id,
    String name,
    String description,
    String message
) {}
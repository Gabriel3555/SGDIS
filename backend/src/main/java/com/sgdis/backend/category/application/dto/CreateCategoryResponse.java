package com.sgdis.backend.category.application.dto;

public record CreateCategoryResponse(
    Long id,
    String name,
    String description,
    String message
) {}
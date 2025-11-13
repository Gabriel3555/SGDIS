package com.sgdis.backend.category.application.dto;

public record CreateCategoryRequest(
    String name,
    String description
) {}
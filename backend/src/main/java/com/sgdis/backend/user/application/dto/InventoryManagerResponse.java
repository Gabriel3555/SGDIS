package com.sgdis.backend.user.application.dto;

public record InventoryManagerResponse(
        Long id,
        String fullName,
        String email,
        String jobTitle,
        String laborDepartment,
        String role
) {}
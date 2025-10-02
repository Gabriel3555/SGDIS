package com.sgdis.backend.inventory.application.dto;

public record AssignedInventoryUserResponse(
        Long userId,
        String email,
        String fullName,
        String jobTitle,
        String laborDepartment,
        String imgUrl,
        String role,
        Boolean status
) {}

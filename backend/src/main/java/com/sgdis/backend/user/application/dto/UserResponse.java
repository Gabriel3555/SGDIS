package com.sgdis.backend.user.application.dto;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        String jobTitle,
        String laborDepartment,
        String imgUrl,
        String role,
        Boolean status,
        String institution
) {}

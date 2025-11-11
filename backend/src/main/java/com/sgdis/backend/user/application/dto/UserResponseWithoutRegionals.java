package com.sgdis.backend.user.application.dto;

public record UserResponseWithoutRegionals(
        String email,
        String fullName,
        String jobTitle,
        String laborDepartment,
        String imgUrl,
        String role,
        Boolean status
) {}

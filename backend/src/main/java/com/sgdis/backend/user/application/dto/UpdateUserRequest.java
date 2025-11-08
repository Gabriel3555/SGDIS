package com.sgdis.backend.user.application.dto;

public record UpdateUserRequest(
        String fullName,
        String jobTitle,
        String laborDepartment,
        String email,
        String role,
        Boolean status,
        String password
) {}

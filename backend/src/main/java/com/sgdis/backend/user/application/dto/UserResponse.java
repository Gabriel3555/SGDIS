package com.sgdis.backend.user.application.dto;

public record UserResponse(
        Long id,
        String username,
        String email,
        String role,
        Boolean status
) {}

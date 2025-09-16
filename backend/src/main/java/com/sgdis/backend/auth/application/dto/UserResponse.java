package com.sgdis.backend.auth.application.dto;

public record UserResponse(
        Long id,
        String username,
        String email,
        String role
) {}

package com.sgdis.backend.user.application.dto;

public record UpdateUserRequest(
        String username,
        String email,
        String role,
        Boolean status
) {}

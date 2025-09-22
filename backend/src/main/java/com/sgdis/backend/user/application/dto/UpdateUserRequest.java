package com.sgdis.backend.user.application.dto;

public record UpdateUserRequest(
        String email,
        String role,
        Boolean status
) {}

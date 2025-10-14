package com.sgdis.backend.user.application.dto;

public record UpdateUserRequest(
        String fullName,
        String email,
        String role,
        Boolean status,
        String password
) {

    // Constructor de respaldo para compatibilidad
    public UpdateUserRequest(String email, String role, Boolean status) {
        this(null, email, role, status, null);
    }
}

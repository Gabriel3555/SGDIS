package com.sgdis.backend.user.application.dto;

public record CreateUserRequest (
    String fullName,
    String email,
    String role,
    String password,
    Boolean status
){}

package com.sgdis.backend.user.application.dto;

public record CreateUserRequest (
    String username,
    String email,
    String role,
    String password,
    Boolean status
){}

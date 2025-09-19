package com.sgdis.backend.auth.application.dto;

public record RegisterRequest(
    String username,
    String password,
    String email
) {}
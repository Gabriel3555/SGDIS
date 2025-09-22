package com.sgdis.backend.auth.application.dto;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.sgdis.backend.user.domain.Role;

@JsonPropertyOrder({"id", "email", "role", "message", "jwt", "refreshToken", "status"})
public record AuthResponse(Long id, String email, Role role, String message, String jwt, String refreshToken, boolean status) {}

package com.sgdis.backend.auth.application.dto;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

@JsonPropertyOrder({"id", "username", "message", "jwt", "refreshToken", "status"})
public record AuthResponse(Long id, String username, String message, String jwt, String refreshToken, boolean status) {}

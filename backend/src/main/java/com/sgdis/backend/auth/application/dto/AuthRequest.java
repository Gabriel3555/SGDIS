package com.sgdis.backend.auth.application.dto;

import jakarta.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;

@Validated
public record AuthRequest(@NotBlank String email, @NotBlank String password) {}
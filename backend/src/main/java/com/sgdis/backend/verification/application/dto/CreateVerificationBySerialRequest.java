package com.sgdis.backend.verification.application.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateVerificationBySerialRequest(
        @NotBlank(message = "Serial is required")
        String serial
) {}


package com.sgdis.backend.verification.application.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateVerificationByLicencePlateNumberRequest(
        @NotBlank(message = "Licence plate number is required")
        String licencePlateNumber
) {}


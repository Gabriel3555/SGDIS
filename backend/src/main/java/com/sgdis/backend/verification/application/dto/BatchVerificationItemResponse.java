package com.sgdis.backend.verification.application.dto;

public record BatchVerificationItemResponse(
        String licencePlateNumber,
        Long verificationId,
        boolean success,
        String message
) {}


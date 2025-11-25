package com.sgdis.backend.verification.application.dto;

import java.time.LocalDateTime;

public record VerificationResponse(
        Long id,
        Long itemId,
        String itemLicencePlateNumber,
        Long userId,
        String userFullName,
        String userEmail,
        String photoUrl,
        LocalDateTime createdAt
) {}


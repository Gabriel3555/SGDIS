package com.sgdis.backend.verification.application.dto;

import java.time.LocalDateTime;

public record VerificationResponse(
        Long id,
        Long itemId,
        String itemLicencePlateNumber,
        String itemName,
        Long inventoryId,
        String inventoryName,
        Long userId,
        String userFullName,
        String userEmail,
        String photoUrl,
        LocalDateTime createdAt
) {}


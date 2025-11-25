package com.sgdis.backend.verification.application.dto;

import java.time.LocalDateTime;

public record LatestVerificationResponse(
        Long id,
        Long itemId,
        String itemLicencePlateNumber,
        String itemName,
        Long inventoryId,
        String inventoryName,
        Long userId,
        String userFullName,
        String userEmail,
        LocalDateTime verifiedAt,
        String photoUrl,
        String status
) {}


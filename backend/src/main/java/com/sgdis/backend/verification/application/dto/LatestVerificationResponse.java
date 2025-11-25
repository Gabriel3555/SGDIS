package com.sgdis.backend.verification.application.dto;

import java.time.LocalDateTime;
import java.util.List;

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
        List<String> photoUrls,
        String status
) {}


package com.sgdis.backend.verification.application.dto;

import java.time.LocalDateTime;
import java.util.List;

public record LatestVerificationResponse(
        Long verificationId,
        Long itemId,
        String itemLicencePlateNumber,
        Long userId,
        String userFullName,
        String userEmail,
        LocalDateTime verifiedAt,
        List<String> photoUrls
) {}


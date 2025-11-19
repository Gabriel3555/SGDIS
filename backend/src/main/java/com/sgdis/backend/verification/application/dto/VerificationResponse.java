package com.sgdis.backend.verification.application.dto;

import java.time.LocalDateTime;
import java.util.List;

public record VerificationResponse(
        Long id,
        Long itemId,
        String itemLicencePlateNumber,
        Long userId,
        String userFullName,
        String userEmail,
        List<String> urlPhotos,
        LocalDateTime createdAt
) {}


package com.sgdis.backend.verification.application.dto;

import java.util.List;

public record CreateBatchVerificationResponse(
        int totalItems,
        int successfulItems,
        int failedItems,
        List<BatchVerificationItemResponse> results,
        String message
) {}


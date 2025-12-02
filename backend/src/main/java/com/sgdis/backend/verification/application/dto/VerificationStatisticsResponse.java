package com.sgdis.backend.verification.application.dto;

public record VerificationStatisticsResponse(
        Long totalVerifications,
        Long completedVerifications,
        Long withEvidence
) {}


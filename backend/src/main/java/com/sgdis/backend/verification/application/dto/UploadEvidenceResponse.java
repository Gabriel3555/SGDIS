package com.sgdis.backend.verification.application.dto;

public record UploadEvidenceResponse(
        String message,
        String fileUrl,
        Long verificationId
) {}


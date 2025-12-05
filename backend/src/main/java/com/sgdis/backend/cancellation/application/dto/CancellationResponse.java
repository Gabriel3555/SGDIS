package com.sgdis.backend.cancellation.application.dto;

import java.time.LocalDateTime;
import java.util.List;

public record CancellationResponse(
        Long id,
        Long requesterId,
        String requesterFullName,
        String requesterEmail,
        Long checkerId,
        String checkerFullName,
        String checkerEmail,
        List<ItemSummary> items,
        String reason,
        LocalDateTime requestedAt,
        LocalDateTime approvedAt,
        LocalDateTime refusedAt,
        String comment,
        Boolean approved,
        String urlFormat,
        String urlCorrectedExample,
        String institutionName
) {
    public record ItemSummary(
            Long id,
            String licencePlateNumber,
            String displayName,
            String productName
    ) {}
}


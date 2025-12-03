package com.sgdis.backend.cancellation.application.dto;

public record CancellationStatisticsResponse(
        Long totalCancellations,
        Long pendingCancellations,
        Long approvedCancellations,
        Long rejectedCancellations
) {
}


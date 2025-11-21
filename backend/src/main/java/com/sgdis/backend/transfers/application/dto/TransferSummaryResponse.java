package com.sgdis.backend.transfers.application.dto;

import com.sgdis.backend.transfers.domain.TransferStatus;

import java.time.LocalDateTime;

public record TransferSummaryResponse(
        Long id,
        Long itemId,
        String itemName,
        Long sourceInventoryId,
        String sourceInventoryName,
        Long destinationInventoryId,
        String destinationInventoryName,
        TransferStatus status,
        Long requestedById,
        String requestedByName,
        Long approvedById,
        String approvedByName,
        LocalDateTime requestedAt,
        LocalDateTime approvedAt,
        String details,
        String approvalNotes
) {
}


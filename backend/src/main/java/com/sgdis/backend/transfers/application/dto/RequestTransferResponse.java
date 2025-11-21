package com.sgdis.backend.transfers.application.dto;

import com.sgdis.backend.transfers.domain.TransferStatus;

import java.time.LocalDateTime;

public record RequestTransferResponse(
        Long transferId,
        Long itemId,
        String itemName,
        Long sourceInventoryId,
        String sourceInventoryName,
        Long destinationInventoryId,
        String destinationInventoryName,
        TransferStatus status,
        Long requestedById,
        String requestedByName,
        LocalDateTime requestedAt,
        String details,
        String message
) {
}


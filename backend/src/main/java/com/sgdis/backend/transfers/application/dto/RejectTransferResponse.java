package com.sgdis.backend.transfers.application.dto;

import com.sgdis.backend.transfers.domain.TransferStatus;

import java.time.LocalDateTime;

public record RejectTransferResponse(
        Long transferId,
        Long itemId,
        String itemName,
        Long sourceInventoryId,
        String sourceInventoryName,
        Long destinationInventoryId,
        String destinationInventoryName,
        TransferStatus status,
        Long rejectedById,
        String rejectedByName,
        LocalDateTime rejectedAt,
        String rejectionNotes,
        String message
) {
}


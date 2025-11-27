package com.sgdis.backend.transfers.application.dto;

public record TransferStatisticsResponse(
        Long totalTransfers,
        Long pendingTransfers,
        Long approvedTransfers,
        Long rejectedTransfers
) {
}


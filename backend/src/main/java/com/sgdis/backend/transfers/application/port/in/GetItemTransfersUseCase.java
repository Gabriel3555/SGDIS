package com.sgdis.backend.transfers.application.port.in;

import com.sgdis.backend.transfers.application.dto.TransferSummaryResponse;

import java.util.List;

public interface GetItemTransfersUseCase {
    List<TransferSummaryResponse> getTransfersByItemId(Long itemId);
}


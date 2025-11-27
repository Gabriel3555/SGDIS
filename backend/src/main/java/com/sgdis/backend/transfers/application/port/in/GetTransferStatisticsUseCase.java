package com.sgdis.backend.transfers.application.port.in;

import com.sgdis.backend.transfers.application.dto.TransferStatisticsResponse;

public interface GetTransferStatisticsUseCase {
    TransferStatisticsResponse getTransferStatistics();
}


package com.sgdis.backend.transfers.application.port.in;

import com.sgdis.backend.transfers.application.dto.TransferSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GetAllTransfersUseCase {
    Page<TransferSummaryResponse> getAllTransfers(Pageable pageable);
}


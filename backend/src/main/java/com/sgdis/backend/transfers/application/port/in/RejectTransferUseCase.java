package com.sgdis.backend.transfers.application.port.in;

import com.sgdis.backend.transfers.application.dto.RejectTransferRequest;
import com.sgdis.backend.transfers.application.dto.RejectTransferResponse;

public interface RejectTransferUseCase {
    RejectTransferResponse rejectTransfer(Long transferId, RejectTransferRequest request);
}


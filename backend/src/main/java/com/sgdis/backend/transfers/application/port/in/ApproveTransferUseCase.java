package com.sgdis.backend.transfers.application.port.in;

import com.sgdis.backend.transfers.application.dto.ApproveTransferRequest;
import com.sgdis.backend.transfers.application.dto.ApproveTransferResponse;

public interface ApproveTransferUseCase {
    ApproveTransferResponse approveTransfer(Long transferId, ApproveTransferRequest request);
}







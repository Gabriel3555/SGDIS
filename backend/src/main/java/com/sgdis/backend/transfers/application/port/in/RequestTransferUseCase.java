package com.sgdis.backend.transfers.application.port.in;

import com.sgdis.backend.transfers.application.dto.RequestTransferRequest;
import com.sgdis.backend.transfers.application.dto.RequestTransferResponse;

public interface RequestTransferUseCase {
    RequestTransferResponse requestTransfer(RequestTransferRequest request);
}


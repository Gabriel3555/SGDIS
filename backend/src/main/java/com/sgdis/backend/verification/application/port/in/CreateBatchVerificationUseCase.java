package com.sgdis.backend.verification.application.port.in;

import com.sgdis.backend.verification.application.dto.BatchVerificationItemRequest;
import com.sgdis.backend.verification.application.dto.CreateBatchVerificationResponse;

import java.util.List;

public interface CreateBatchVerificationUseCase {
    CreateBatchVerificationResponse createBatchVerification(List<BatchVerificationItemRequest> items);
}


package com.sgdis.backend.verification.application.port.in;

import com.sgdis.backend.verification.application.dto.VerificationResponse;

import java.util.List;

public interface GetVerificationsByItemUseCase {
    List<VerificationResponse> getVerificationsByItemId(Long itemId);
}


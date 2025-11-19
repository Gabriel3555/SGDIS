package com.sgdis.backend.verification.application.port.in;

import com.sgdis.backend.verification.application.dto.VerificationResponse;
import org.springframework.data.domain.Page;

public interface GetItemVerificationsUseCase {
    Page<VerificationResponse> getItemVerifications(Long itemId, int page, int size);
}


package com.sgdis.backend.verification.application.port.in;

import com.sgdis.backend.verification.application.dto.CreateVerificationBySerialRequest;
import com.sgdis.backend.verification.application.dto.CreateVerificationResponse;

public interface CreateVerificationBySerialUseCase {
    CreateVerificationResponse createVerificationBySerial(CreateVerificationBySerialRequest request);
}


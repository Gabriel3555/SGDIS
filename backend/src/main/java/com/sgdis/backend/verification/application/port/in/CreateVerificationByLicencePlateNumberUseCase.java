package com.sgdis.backend.verification.application.port.in;

import com.sgdis.backend.verification.application.dto.CreateVerificationByLicencePlateNumberRequest;
import com.sgdis.backend.verification.application.dto.CreateVerificationResponse;

public interface CreateVerificationByLicencePlateNumberUseCase {
    CreateVerificationResponse createVerificationByLicencePlateNumber(CreateVerificationByLicencePlateNumberRequest request);
}


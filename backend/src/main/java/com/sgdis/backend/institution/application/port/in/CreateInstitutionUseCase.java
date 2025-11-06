package com.sgdis.backend.institution.application.port.in;

import com.sgdis.backend.institution.application.dto.CreateInstitutionRequest;
import com.sgdis.backend.institution.application.dto.InstitutionResponse;


public interface CreateInstitutionUseCase {
    InstitutionResponse createInstitution(CreateInstitutionRequest createInstitutionRequest);
}

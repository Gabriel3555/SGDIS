package com.sgdis.backend.institution.application.port.in;

import com.sgdis.backend.institution.application.dto.UpdateInstitutionRequest;
import com.sgdis.backend.institution.application.dto.UpdateInstitutionResponse;

public interface UpdateInstitutionUseCase {
    //Update
    UpdateInstitutionResponse updateInstitution(Long id, UpdateInstitutionRequest request);
}

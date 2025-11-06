package com.sgdis.backend.institution.application.port.in;

import com.sgdis.backend.institution.application.dto.GetAllInstitutionResponse;
import com.sgdis.backend.institution.domain.Institution;

import java.util.List;

public interface GetAllInstitutionUseCase {
    List<GetAllInstitutionResponse> getAllInstitution();
}

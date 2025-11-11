package com.sgdis.backend.institution.application.port.in;

import com.sgdis.backend.institution.application.dto.GetAllInstitutionResponse;

import java.util.List;

public interface GetAllInstitutionUseCase {
    List<GetAllInstitutionResponse> getAllInstitution();
}

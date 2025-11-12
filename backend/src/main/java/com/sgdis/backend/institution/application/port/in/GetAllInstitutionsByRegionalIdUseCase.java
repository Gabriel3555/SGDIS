package com.sgdis.backend.institution.application.port.in;

import com.sgdis.backend.institution.application.dto.InstitutionResponseWithoutRegionalResponse;

import java.util.List;

public interface GetAllInstitutionsByRegionalIdUseCase {
    List<InstitutionResponseWithoutRegionalResponse> getAllInstitutionsByRegionalId(Long id);
}

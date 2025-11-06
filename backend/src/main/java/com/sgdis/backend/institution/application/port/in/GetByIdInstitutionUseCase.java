package com.sgdis.backend.institution.application.port.in;

import com.sgdis.backend.institution.application.dto.GetByIdResponse;
import com.sgdis.backend.institution.domain.Institution;

public interface GetByIdInstitutionUseCase {
    //Get by id
    GetByIdResponse getById(Long id);
}

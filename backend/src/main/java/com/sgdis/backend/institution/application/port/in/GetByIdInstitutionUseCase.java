package com.sgdis.backend.institution.application.port.in;

import com.sgdis.backend.institution.application.dto.GetByIdResponse;

public interface GetByIdInstitutionUseCase {
    //Get by id
    GetByIdResponse getById(Long id);
}

package com.sgdis.backend.institution.application.port.in;

import com.sgdis.backend.institution.domain.Institution;
import com.sgdis.backend.user.application.dto.CreateUserRequest;

public interface CreateInstitutionUseCase {
    Institution createInstitution(CreateUserRequest  createUserRequest);
}

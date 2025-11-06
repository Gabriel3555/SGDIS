package com.sgdis.backend.institution.application.port.out;

import com.sgdis.backend.institution.domain.Institution;
import org.springframework.stereotype.Repository;

@Repository
public interface UpdateInstitutionRepository {
    Institution updateInstitution(Institution institution);
}

package com.sgdis.backend.institution.application.port.out;

import com.sgdis.backend.institution.domain.Institution;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GetAllInstitutionRepository {
    List<Institution> getAllInstitutions();
}

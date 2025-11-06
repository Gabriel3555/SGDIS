package com.sgdis.backend.institution.application.service;

import com.sgdis.backend.institution.application.dto.UpdateInstitutionRequest;
import com.sgdis.backend.institution.application.dto.UpdateInstitutionResponse;
import com.sgdis.backend.institution.application.port.in.CreateInstitutionUseCase;
import com.sgdis.backend.institution.application.port.in.GetAllInstitutionUseCase;
import com.sgdis.backend.institution.application.port.in.GetByIdInstitutionUseCase;
import com.sgdis.backend.institution.application.port.in.UpdateInstitutionUseCase;
import com.sgdis.backend.institution.domain.Institution;
import com.sgdis.backend.user.application.dto.CreateUserRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor

public class InstitutionService implements
        CreateInstitutionUseCase,
        GetAllInstitutionUseCase,
        GetByIdInstitutionUseCase,
        UpdateInstitutionUseCase
{
    @Override
    public Institution createInstitution(CreateUserRequest createUserRequest) {

        return null;
    }

    @Override
    public List<Institution> getAllInstitution() {
        return List.of();
    }

    @Override
    public Institution getInstitutionById(Long id) {
        return null;
    }

    @Override
    public UpdateInstitutionResponse updateInstitution(Long id, UpdateInstitutionRequest request) {
        return null;
    }
}

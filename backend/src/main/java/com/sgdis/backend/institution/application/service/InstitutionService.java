package com.sgdis.backend.institution.application.service;

import com.sgdis.backend.institution.application.dto.*;
import com.sgdis.backend.institution.application.port.in.CreateInstitutionUseCase;
import com.sgdis.backend.institution.application.port.in.GetAllInstitutionUseCase;
import com.sgdis.backend.institution.application.port.in.GetByIdInstitutionUseCase;
import com.sgdis.backend.institution.application.port.in.UpdateInstitutionUseCase;
import com.sgdis.backend.institution.application.port.out.CreateInstitutionRepository;
import com.sgdis.backend.institution.application.port.out.GetAllInstitutionRepository;
import com.sgdis.backend.institution.application.port.out.GetByIdInstitutionRepository;
import com.sgdis.backend.institution.application.port.out.UpdateInstitutionRepository;
import com.sgdis.backend.institution.domain.Institution;
import com.sgdis.backend.institution.mapper.InstitutionMapper;
import com.sgdis.backend.user.application.dto.CreateUserRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor

public class InstitutionService implements
        CreateInstitutionUseCase,
        GetAllInstitutionUseCase,
        GetByIdInstitutionUseCase,
        UpdateInstitutionUseCase
{

    private final CreateInstitutionRepository createInstitutionRepository;
    private final UpdateInstitutionRepository updateInstitutionRepository;
    private final GetByIdInstitutionRepository getByIdInstitutionRepository;
    private final GetAllInstitutionRepository getAllInstitutionRepository;


    @Override
    public List<GetAllInstitutionResponse> getAllInstitution() {
        return getAllInstitutionRepository.getAllInstitutions()
                .stream()
                .map(InstitutionMapper::toGetAllResponse)
                .collect(Collectors.toList());
    }

    @Override
    public GetByIdResponse getById(Long id) {
        return InstitutionMapper.toGetByIdResponse(getByIdInstitutionRepository.getById(id));
    }

    @Override
    public UpdateInstitutionResponse updateInstitution(Long id, UpdateInstitutionRequest request) {
        Institution institution = InstitutionMapper.toDomain(request,id);
        Institution updatedInstitution = updateInstitutionRepository.updateInstitution(institution);
        return InstitutionMapper.toUpdateResponse(updatedInstitution);

    }

    @Override
    public InstitutionResponse createInstitution(CreateInstitutionRequest createInstitutionRequest) {
        Institution institution = InstitutionMapper.toDomain(createInstitutionRequest);
        Institution saved = createInstitutionRepository.createInstitution(institution);
        return InstitutionMapper.toResponse(saved);
    }
}

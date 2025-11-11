package com.sgdis.backend.institution.application.service;

import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.institution.application.dto.*;
import com.sgdis.backend.institution.application.port.in.CreateInstitutionUseCase;
import com.sgdis.backend.institution.application.port.in.GetAllInstitutionUseCase;
import com.sgdis.backend.institution.application.port.in.GetByIdInstitutionUseCase;
import com.sgdis.backend.institution.application.port.in.UpdateInstitutionUseCase;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import com.sgdis.backend.institution.infrastructure.repository.SpringDataInstitutionRepository;
import com.sgdis.backend.institution.mapper.InstitutionMapper;
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

    private final SpringDataInstitutionRepository institutionRepository;


    @Override
    public List<GetAllInstitutionResponse> getAllInstitution() {
        return institutionRepository.findAll()
                .stream()
                .map(InstitutionMapper::toGetAllResponse)
                .collect(Collectors.toList());
    }

    @Override
    public GetByIdResponse getById(Long id) {
        InstitutionEntity institution = institutionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Institution with id " + id + " not found"));
        return InstitutionMapper.toGetByIdResponse(institution);
    }

    @Override
    public UpdateInstitutionResponse updateInstitution(Long id, UpdateInstitutionRequest request) {
        InstitutionEntity institution = InstitutionMapper.fromUpdateRequest(request, id);
        InstitutionEntity updatedInstitution = institutionRepository.save(institution);
        return InstitutionMapper.toUpdateResponse(updatedInstitution);
    }

    @Override
    public InstitutionResponse createInstitution(CreateInstitutionRequest createInstitutionRequest) {
        InstitutionEntity institution = InstitutionMapper.fromCreateRequest(createInstitutionRequest);
        InstitutionEntity saved = institutionRepository.save(institution);
        return InstitutionMapper.toResponse(saved);
    }
}

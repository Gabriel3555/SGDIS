package com.sgdis.backend.institution.application.service;

import com.sgdis.backend.data.regional.entity.RegionalEntity;
import com.sgdis.backend.data.regional.repositories.SpringDataRegionalRepository;
import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.institution.application.dto.*;
import com.sgdis.backend.institution.application.port.in.*;
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
        UpdateInstitutionUseCase,
        GetAllInstitutionsByRegionalIdUseCase
{

    private final SpringDataInstitutionRepository institutionRepository;
    private final SpringDataRegionalRepository institutionRegionalRepository;


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

    @Override
    public List<InstitutionResponseWithoutRegionalResponse> getAllInstitutionsByRegionalId(Long id) {
        // First validate that the regional exists
        institutionRegionalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Regional with id " + id + " not found"));
        
        // Use the more efficient method to find institutions by regional ID directly
        List<InstitutionEntity> institutions = institutionRepository.findByRegionalId(id);
        
        // Map entities to DTO response without regional data
        return InstitutionMapper.toInstitutionListWithoutRegional(institutions);
    }
}
